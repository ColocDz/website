<?php
// ==========================================
// Secure PHP Deployment Script for cPanel
// ==========================================

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
ini_set('memory_limit', '1024M');
ini_set('max_execution_time', 600);

// 1. CHOOSE A STRONG SECRET TOKEN
define('DEPLOY_TOKEN', 'c8f7a9d2b4e3f5a1c0d9e8b7a6f5e4d3');

// 2. TARGET DIRECTORY
define('TARGET_DIR_NAME', 'repositories/website/standalone');

header('Content-Type: application/json');

function get_user_home() {
    if (isset($_SERVER['DOCUMENT_ROOT'])) {
        $parts = explode('/', trim($_SERVER['DOCUMENT_ROOT'], '/'));
        if (count($parts) >= 2) {
            return '/' . $parts[0] . '/' . $parts[1];
        }
    }
    return '/home/colocdz1';
}

// Check token
$token = isset($_POST['token']) ? $_POST['token'] : (isset($_GET['token']) ? $_GET['token'] : null);
if ($token !== DEPLOY_TOKEN) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized token']);
    exit;
}

// Debug logs retrieval
if (isset($_GET['action']) && $_GET['action'] === 'log') {
    header('Content-Type: text/plain');
    $log_path = get_user_home() . '/logs/passenger.log';
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
    echo "Detected Home Dir: " . $home . "\n\n";
    $paths = [
        'repositories/website/server.js',
        'repositories/website/standalone/server.js',
    ];
    echo "--- File Existence Check ---\n";
    foreach ($paths as $p) {
        $full = $home . '/' . $p;
        echo $p . ": " . (file_exists($full) ? "EXISTS" : "NOT FOUND") . "\n";
    }
    echo "\n--- Scanning repositories/website ---";
    $repoDir = $home . '/repositories/website';
    if (is_dir($repoDir)) {
        print_r(scandir($repoDir));
    } else {
        echo "\nrepositories/website directory does not exist!\n";
    }
    echo "\n--- Scanning repositories/website/standalone ---";
    $stDir = $home . '/repositories/website/standalone';
    if (is_dir($stDir)) {
        print_r(scandir($stDir));
    } else {
        echo "\nrepositories/website/standalone directory does not exist!\n";
    }
    exit;
}

// Chunked upload handling
$uploaded_file = null;
if (isset($_POST['chunk_index']) && isset($_POST['total_chunks']) && isset($_FILES['file'])) {
    $chunkIndex = intval($_POST['chunk_index']);
    $totalChunks = intval($_POST['total_chunks']);
    $uploadId = preg_replace('/[^a-zA-Z0-9_-]/', '', $_POST['upload_id'] ?? 'default');
    
    $tempDir = get_user_home() . '/tmp/uploads_' . $uploadId;
    if (!is_dir($tempDir)) @mkdir($tempDir, 0755, true);
    
    $chunkFile = $tempDir . '/chunk_' . $chunkIndex;
    move_uploaded_file($_FILES['file']['tmp_name'], $chunkFile);
    
    $allArrived = true;
    for ($i = 0; $i < $totalChunks; $i++) {
        if (!file_exists($tempDir . '/chunk_' . $i)) {
            $allArrived = false;
            break;
        }
    }
    
    if (!$allArrived) {
        echo json_encode(['success' => true, 'chunk' => $chunkIndex, 'assembled' => false]);
        exit;
    }
    
    // Reassemble full file
    $assembledFile = $tempDir . '/complete.tar.gz';
    $out = fopen($assembledFile, 'wb');
    for ($i = 0; $i < $totalChunks; $i++) {
        $cPath = $tempDir . '/chunk_' . $i;
        $in = fopen($cPath, 'rb');
        while (!feof($in)) {
            fwrite($out, fread($in, 65536));
        }
        fclose($in);
        @unlink($cPath);
    }
    fclose($out);
    
    $uploaded_file = $assembledFile;
} else if (isset($_FILES['file'])) {
    $uploaded_file = $_FILES['file']['tmp_name'];
} else {
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
    $extracted_count = 0;
    
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
            $extracted_count++;
            
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
    return $extracted_count;
}

// Extract .tar.gz file
$extractCount = extract_tar_gz($uploaded_file, $target_dir);

// Clean temp file
if (isset($assembledFile) && file_exists($assembledFile)) {
    @unlink($assembledFile);
    $dirToDel = dirname($assembledFile);
    @rmdir($dirToDel);
}

if (is_numeric($extractCount) && $extractCount > 0) {
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
        'total_extracted' => $extractCount
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Extraction failed or extracted 0 files. Extracted count: ' . $extractCount]);
}
exit;
