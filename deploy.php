<?php
// ==========================================
// Secure PHP Deployment Script for cPanel
// ==========================================

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
ini_set('memory_limit', '1024M');
ini_set('max_execution_time', 300);

// 1. CHOOSE A STRONG SECRET TOKEN
define('DEPLOY_TOKEN', 'c8f7a9d2b4e3f5a1c0d9e8b7a6f5e4d3');

// 2. TARGET DIRECTORY
define('TARGET_DIR_NAME', 'repositories/website');

header('Content-Type: application/json');
usleep(300000); // Throttling delay (300ms) to prevent cPanel firewall rate-limit triggers

// Check if POST data was discarded due to post_max_size limit
if ($_SERVER['REQUEST_METHOD'] === 'POST' && empty($_POST) && empty($_FILES) && $_SERVER['CONTENT_LENGTH'] > 0) {
    http_response_code(413);
    echo json_encode([
        'error' => 'The uploaded file size (' . round($_SERVER['CONTENT_LENGTH'] / 1024 / 1024, 2) . 'MB) exceeds the server\'s post_max_size limit in PHP. Please increase post_max_size and upload_max_filesize in cPanel (Select PHP Version -> Options or MultiPHP INI Editor) to at least 100M.'
    ]);
    exit;
}

// Check token
$token = isset($_POST['token']) ? $_POST['token'] : (isset($_GET['token']) ? $_GET['token'] : null);
if ($token !== DEPLOY_TOKEN) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized token']);
    exit;
}

// Direct script update via Base64 payload
if (isset($_POST['b64_script'])) {
    header('Content-Type: text/plain');
    $code = base64_decode($_POST['b64_script']);
    $self = __FILE__;
    if ($code && strpos($code, 'DEPLOY_TOKEN') !== false) {
        @chmod($self, 0777);
        file_put_contents($self, $code);
        if (function_exists('opcache_invalidate')) {
            @opcache_invalidate($self, true);
        }
        echo "Updated " . $self . " successfully via Base64 payload!\n";
    } else {
        echo "Invalid Base64 script payload.\n";
    }
    exit;
}

// Debug logs retrieval
if (isset($_GET['action']) && $_GET['action'] === 'log') {
    header('Content-Type: text/plain');
    $log_path = '/home/colocdz1/logs/passenger.log';
    if (file_exists($log_path)) {
        $lines = file($log_path);
        $search = isset($_GET['q']) ? $_GET['q'] : null;
        if ($search) {
            $matching = array_filter($lines, function($line) use ($search) {
                return strpos($line, $search) !== false;
            });
            echo implode("", array_slice($matching, -200));
        } else {
            $count = isset($_GET['lines']) ? intval($_GET['lines']) : 100;
            $last_lines = array_slice($lines, -$count);
            echo implode("", $last_lines);
        }
    } else {
        echo "Log file not found at: " . $log_path;
    }
    exit;
}

// Helper to get user home directory reliably
function get_user_home() {
    return '/home/colocdz1';
}

// Restart Passenger Node.js app
if (isset($_GET['action']) && $_GET['action'] === 'restart') {
    header('Content-Type: text/plain');
    $home = get_user_home();
    $paths = [
        $home . '/repositories/website/standalone/tmp/restart.txt',
        $home . '/repositories/website/tmp/restart.txt',
    ];
    foreach ($paths as $restart_file) {
        $dir = dirname($restart_file);
        if (!is_dir($dir)) @mkdir($dir, 0755, true);
        @file_put_contents($restart_file, time());
    }
    echo "Passenger restart trigger created at both locations!\n";
    echo "Please refresh https://colocdz.com now!";
    exit;
}

// File structure check
if (isset($_GET['action']) && $_GET['action'] === 'check') {
    header('Content-Type: text/plain');
    $home = get_user_home();
    $paths = [
        'repositories/website/server.js',
        'repositories/website/standalone/server.js',
    ];
    echo "--- File Existence Check ---\n";
    foreach ($paths as $p) {
        $full = $home . '/' . $p;
        echo $p . ": " . (file_exists($full) ? "EXISTS" : "NOT FOUND") . "\n";
    }
    echo "\n--- Content of repositories/website/standalone/server.js ---\n";
    $rs = $home . '/repositories/website/standalone/server.js';
    if (file_exists($rs)) {
        echo file_get_contents($rs);
    } else {
        echo "server.js does not exist.\n";
    }

    echo "\n--- Scanning repositories/website/standalone ---\n";
    $dir = $home . '/repositories/website/standalone';
    if (is_dir($dir)) {
        print_r(scandir($dir));
        if (is_dir($dir . '/.next')) {
            echo "\n--- Scanning repositories/website/standalone/.next ---\n";
            print_r(scandir($dir . '/.next'));
        } else {
            echo "\n--- .next directory DOES NOT EXIST in standalone! ---\n";
        }
    } else {
        echo "Directory $dir does not exist.\n";
    }
    exit;
}

// Check file upload
if (!isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded']);
    exit;
}

$home_dir = get_user_home();
$target_dir = $home_dir . '/' . TARGET_DIR_NAME;

// Ensure target directory exists
if (!is_dir($target_dir)) {
    if (!mkdir($target_dir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create target directory: ' . $target_dir]);
        exit;
    }
}

// Helper to extract .tar.gz files in pure PHP streaming mode (uses < 5MB RAM)
function extract_tar_gz($archivePath, $targetDir) {
    if (!function_exists('gzopen')) {
        return 'The zlib PHP extension (gzopen function) is missing on this server.';
    }
    
    $fp = @gzopen($archivePath, 'rb');
    if (!$fp) {
        return 'Failed to open Gzip archive stream.';
    }
    
    $long_filename = null;
    
    while (!gzeof($fp)) {
        $header = gzread($fp, 512);
        if (strlen($header) < 512 || pack("a512", $header) === pack("a512", "")) {
            break;
        }
        
        $name = trim(substr($header, 0, 100), "\0 ");
        $magic = substr($header, 257, 5);
        $prefix = ($magic === 'ustar') ? trim(substr($header, 345, 155), "\0 ") : '';
        $filename = ($prefix !== '') ? $prefix . '/' . $name : $name;
        $filesize = octdec(trim(substr($header, 124, 12), "\0 "));
        $typeflag = substr($header, 156, 1);
        
        if ($typeflag === 'L') {
            $readLen = ceil($filesize / 512) * 512;
            $longData = gzread($fp, $readLen);
            $long_filename = trim(substr($longData, 0, $filesize), "\0 ");
            continue;
        }
        
        if ($long_filename !== null) {
            $filename = $long_filename;
            $long_filename = null;
        }
        
        $filename = str_replace('\\', '/', $filename);
        $filename = preg_replace('#^\./+#', '', $filename);

        if ($filename === '' || $filename === '.' || strpos($filename, '..') !== false) {
            $skipLen = ceil($filesize / 512) * 512;
            if ($skipLen > 0) {
                while ($skipLen > 0) {
                    $readSize = min($skipLen, 65536);
                    gzread($fp, $readSize);
                    $skipLen -= $readSize;
                }
            }
            continue;
        }
        
        if ($typeflag === '5') {
            $dest = $targetDir . '/' . $filename;
            if (!is_dir($dest)) @mkdir($dest, 0755, true);
        } else if ($typeflag === '0' || $typeflag === "\0" || $typeflag === '') {
            $dest = $targetDir . '/' . $filename;
            $dir = dirname($dest);
            if (!is_dir($dir)) @mkdir($dir, 0755, true);
            
            $outFp = @fopen($dest, 'wb');
            $remaining = $filesize;
            while ($remaining > 0 && !gzeof($fp)) {
                $chunkSize = min($remaining, 65536);
                $chunk = gzread($fp, $chunkSize);
                if ($chunk === false) break;
                if ($outFp) fwrite($outFp, $chunk);
                $remaining -= strlen($chunk);
            }
            if ($outFp) fclose($outFp);
            $GLOBALS['extracted_files_list'][] = $filename;
            
            $padding = (512 - ($filesize % 512)) % 512;
            if ($padding > 0) gzread($fp, $padding);
        } else {
            $skipLen = ceil($filesize / 512) * 512;
            if ($skipLen > 0) {
                while ($skipLen > 0) {
                    $readSize = min($skipLen, 65536);
                    gzread($fp, $readSize);
                    $skipLen -= $readSize;
                }
            }
        }
    }
    gzclose($fp);
    return true;
}

// Extract .tar.gz file
$result = extract_tar_gz($uploaded_file, $target_dir);

if ($result === true) {
    // Automatically trigger Passenger restart
    $paths = [
        $home_dir . '/repositories/website/standalone/tmp/restart.txt',
        $home_dir . '/repositories/website/tmp/restart.txt',
    ];
    foreach ($paths as $restart_file) {
        $dir = dirname($restart_file);
        if (!is_dir($dir)) @mkdir($dir, 0755, true);
        @file_put_contents($restart_file, time());
    }
    echo json_encode([
        'success' => true,
        'message' => 'Deployment successful!',
        'total_extracted' => count($GLOBALS['extracted_files_list'] ?? [])
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => $result]);
}
exit;
