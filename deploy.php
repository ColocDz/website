<?php
// ==========================================
// Secure PHP Deployment Script for cPanel
// ==========================================

ini_set('display_errors', 0);
error_reporting(E_ALL);
ini_set('memory_limit', '1024M');
ini_set('max_execution_time', 600);

// 1. SECRET TOKEN
define('DEPLOY_TOKEN', 'c8f7a9d2b4e3f5a1c0d9e8b7a6f5e4d3');

// 2. TARGET DIRECTORY
define('TARGET_DIR_NAME', 'repositories/website');

function get_user_home() {
    if (isset($_SERVER['DOCUMENT_ROOT'])) {
        $parts = explode('/', trim($_SERVER['DOCUMENT_ROOT'], '/'));
        if (count($parts) >= 2) {
            return '/' . $parts[0] . '/' . $parts[1];
        }
    }
    return '/home/colocdz1';
}

$token = isset($_POST['token']) ? $_POST['token'] : (isset($_GET['token']) ? $_GET['token'] : null);
if ($token !== DEPLOY_TOKEN) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Unauthorized token']);
    exit;
}

$home_dir = get_user_home();

// Fix file permissions for Apache/Passenger
if (isset($_GET['action']) && $_GET['action'] === 'fix_perms') {
    header('Content-Type: text/plain');
    $home = get_user_home();
    @chmod($home, 0755);
    @chmod($home . '/repositories', 0755);
    @chmod($home . '/repositories/website', 0755);
    @chmod($home . '/repositories/website/standalone', 0755);
    
    function chmod_recursive($dir) {
        if (!is_dir($dir)) return;
        @chmod($dir, 0755);
        $items = @scandir($dir);
        if ($items) {
            foreach ($items as $item) {
                if ($item === '.' || $item === '..') continue;
                $path = $dir . '/' . $item;
                if (is_dir($path)) {
                    chmod_recursive($path);
                } else {
                    @chmod($path, 0644);
                }
            }
        }
    }
    chmod_recursive($home . '/repositories/website');
    
    $paths = [
        $home . '/repositories/website/standalone/tmp/restart.txt',
        $home . '/repositories/website/tmp/restart.txt',
    ];
    foreach ($paths as $rf) {
        $d = dirname($rf);
        if (!is_dir($d)) @mkdir($d, 0755, true);
        @file_put_contents($rf, time());
    }
    echo "Permissions fixed to 0755/0644 and Passenger restarted successfully!";
    exit;
}
    header('Content-Type: text/plain');
    echo "Detected Home Dir: " . $home_dir . "\n\n";
    $paths = [
        'repositories/website/server.js',
        'repositories/website/standalone/server.js',
    ];
    echo "--- File Existence Check ---\n";
    foreach ($paths as $p) {
        $full = $home_dir . '/' . $p;
        echo $p . ": " . (file_exists($full) ? "EXISTS" : "NOT FOUND") . "\n";
    }
    echo "\n--- Scanning repositories/website/standalone ---\n";
    $stDir = $home_dir . '/repositories/website/standalone';
    if (is_dir($stDir)) {
        print_r(scandir($stDir));
    } else {
        echo "repositories/website/standalone directory does not exist!\n";
    }
    exit;
}

// Action: restart
if (isset($_GET['action']) && $_GET['action'] === 'restart') {
    header('Content-Type: text/plain');
    $paths = [
        $home_dir . '/repositories/website/standalone/tmp/restart.txt',
        $home_dir . '/repositories/website/tmp/restart.txt',
    ];
    foreach ($paths as $restart_file) {
        $dir = dirname($restart_file);
        if (!is_dir($dir)) @mkdir($dir, 0755, true);
        @file_put_contents($restart_file, time());
    }
    echo "Passenger restart trigger created successfully!\n";
    echo "Please refresh https://colocdz.com now!";
    exit;
}

// Action: log
if (isset($_GET['action']) && $_GET['action'] === 'log') {
    header('Content-Type: text/plain');
    $log_path = $home_dir . '/logs/passenger.log';
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

// Extraction Helper
function do_extract($archivePath, $targetDir) {
    if (!is_dir($targetDir)) {
        @mkdir($targetDir, 0755, true);
    }
    
    // Method 1: Try system tar command
    if (function_exists('exec')) {
        $cmd = "tar -xzf " . escapeshellarg($archivePath) . " -C " . escapeshellarg($targetDir) . " 2>&1";
        $output = [];
        $returnVar = 0;
        @exec($cmd, $output, $returnVar);
        if ($returnVar === 0 && file_exists($targetDir . '/server.js')) {
            return "Extracted successfully via system tar command";
        }
    }
    
    // Method 2: Try PharData
    if (class_exists('PharData')) {
        try {
            $phar = new PharData($archivePath);
            $phar->extractTo($targetDir, null, true);
            if (file_exists($targetDir . '/server.js')) {
                return "Extracted successfully via PharData";
            }
        } catch (Exception $e) {}
    }
    
    // Method 3: Pure PHP Tar Stream Extractor
    return extract_tar_gz_pure_php($archivePath, $targetDir);
}

function extract_tar_gz_pure_php($archivePath, $targetDir) {
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
    return "Extracted " . $extracted_count . " files via pure PHP stream";
}

// Upload Handling
header('Content-Type: application/json');

$uploaded_archive = null;

if (isset($_POST['chunk_index']) && isset($_POST['total_chunks']) && isset($_FILES['file'])) {
    $chunkIndex = intval($_POST['chunk_index']);
    $totalChunks = intval($_POST['total_chunks']);
    $uploadId = preg_replace('/[^a-zA-Z0-9_-]/', '', $_POST['upload_id'] ?? 'default');
    
    $tempDir = $home_dir . '/tmp/uploads_' . $uploadId;
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
    
    // Reassemble full archive
    $assembledFile = $tempDir . '/complete.tar.gz';
    $out = @fopen($assembledFile, 'wb');
    for ($i = 0; $i < $totalChunks; $i++) {
        $cPath = $tempDir . '/chunk_' . $i;
        $in = @fopen($cPath, 'rb');
        if ($in) {
            while (!feof($in)) {
                fwrite($out, fread($in, 65536));
            }
            fclose($in);
            @unlink($cPath);
        }
    }
    if ($out) fclose($out);
    
    $uploaded_archive = $assembledFile;
} else if (isset($_FILES['file'])) {
    $uploaded_archive = $_FILES['file']['tmp_name'];
} else {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded']);
    exit;
}

if (!$uploaded_archive || !file_exists($uploaded_archive)) {
    http_response_code(400);
    echo json_encode(['error' => 'Uploaded archive file is missing or unreadable']);
    exit;
}

$target_dir = $home_dir . '/' . TARGET_DIR_NAME;

// Extract
$resultMessage = do_extract($uploaded_archive, $target_dir);

// Cleanup temp assembled file
if (isset($assembledFile) && file_exists($assembledFile)) {
    @unlink($assembledFile);
    @rmdir(dirname($assembledFile));
}

// Fix permissions on extracted files so Apache/Passenger can read them
if (function_exists('chmod_recursive')) {
    chmod_recursive($target_dir);
} else {
    @chmod($target_dir, 0755);
}

// Self-update deploy.php in public_html
$deployInTarget = $target_dir . '/deploy.php';
$publicHtmlDeploy = $home_dir . '/public_html/deploy.php';
if (file_exists($deployInTarget)) {
    @copy($deployInTarget, $publicHtmlDeploy);
}

// Trigger Passenger Restart
$restartPaths = [
    $home_dir . '/repositories/website/standalone/tmp/restart.txt',
    $home_dir . '/repositories/website/tmp/restart.txt',
];
foreach ($restartPaths as $rf) {
    $d = dirname($rf);
    if (!is_dir($d)) @mkdir($d, 0755, true);
    @file_put_contents($rf, time());
}

echo json_encode([
    'success' => true,
    'message' => 'Deployment successful! ' . $resultMessage,
    'target' => $target_dir
]);
exit;
