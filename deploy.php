<?php
// ==========================================
// Secure PHP Deployment Script for cPanel
// ==========================================

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
ini_set('memory_limit', '512M');
ini_set('max_execution_time', 300);

// 1. CHOOSE A STRONG SECRET TOKEN
define('DEPLOY_TOKEN', 'c8f7a9d2b4e3f5a1c0d9e8b7a6f5e4d3');

// 2. TARGET DIRECTORY
define('TARGET_DIR_NAME', 'repositories/website/standalone');

header('Content-Type: application/json');

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
            echo implode("", $matching);
        } else {
            $last_lines = array_slice($lines, -400);
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
    echo "\n--- Contents of repositories/website/server.js ---\n";
    $root_s = $home . '/repositories/website/server.js';
    echo file_exists($root_s) ? file_get_contents($root_s) : "File not found";
    echo "\n--- Scanning repositories/website/standalone ---\n";
    $dir = $home . '/repositories/website/standalone';
    if (is_dir($dir)) {
        print_r(scandir($dir));
    } else {
        echo "Directory $dir does not exist.\n";
    }
    exit;
}

// Direct fix for root server.js wrapper
if (isset($_GET['action']) && $_GET['action'] === 'fix_wrapper') {
    header('Content-Type: text/plain');
    $home = get_user_home();
    $root_server = $home . '/repositories/website/server.js';
    $wrapper = "const fs = require('fs');\nconst path = require('path');\nconst standaloneDir = path.join(__dirname, 'standalone');\nconst standaloneServer = path.join(standaloneDir, 'server.js');\nprocess.env.NODE_PATH = path.join(standaloneDir, 'node_modules') + path.delimiter + (process.env.NODE_PATH || '');\nrequire('module').Module._initPaths();\nif (fs.existsSync(standaloneServer)) {\n  process.chdir(standaloneDir);\n  require(standaloneServer);\n}\n";
    file_put_contents($root_server, $wrapper);
    
    // Touch restart files
    $paths = [
        $home . '/repositories/website/standalone/tmp/restart.txt',
        $home . '/repositories/website/tmp/restart.txt',
    ];
    foreach ($paths as $rf) {
        $dir = dirname($rf);
        if (!is_dir($dir)) @mkdir($dir, 0755, true);
        @file_put_contents($rf, time());
    }
    echo "Successfully updated " . $root_server . " and triggered Passenger restart!\n";
    echo "Updated content:\n" . file_get_contents($root_server);
    exit;
}

// Update deploy.php itself from GitHub main branch
if (isset($_GET['action']) && $_GET['action'] === 'update_self') {
    header('Content-Type: text/plain');
    $self_path = __FILE__;
    $new_code = @file_get_contents('https://raw.githubusercontent.com/ColocDz/website/main/deploy.php');
    if ($new_code && strpos($new_code, 'DEPLOY_TOKEN') !== false) {
        file_put_contents($self_path, $new_code);
        echo "Successfully updated " . $self_path . " from GitHub!\n";
    } else {
        echo "Failed to download deploy.php from GitHub.\n";
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

// Helper to clean up old build files, but keep .env intact
function clean_dir($dir) {
    if (!is_dir($dir)) return;
    $items = scandir($dir);
    foreach ($items as $item) {
        if ($item === '.' || $item === '..' || $item === '.env') continue;
        $path = $dir . '/' . $item;
        if (is_dir($path)) {
            clean_dir($path);
            @rmdir($path);
        } else {
            @unlink($path);
        }
    }
}

// Ensure target directory exists
if (!is_dir($target_dir)) {
    if (!mkdir($target_dir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create target directory: ' . $target_dir]);
        exit;
    }
}

// Clean target directory of old files (keeping .env)
clean_dir($target_dir);

$uploaded_file = $_FILES['file']['tmp_name'];

// Helper to extract .tar.gz files in pure PHP without extensions
function extract_tar_gz($archivePath, $targetDir) {
    if (!function_exists('gzdecode')) {
        return 'The zlib PHP extension (gzdecode function) is missing on this server. Please contact your host to enable it.';
    }
    
    $data = file_get_contents($archivePath);
    if ($data === false) {
        return 'Failed to read uploaded archive file.';
    }
    
    $data = @gzdecode($data);
    if ($data === false) {
        return 'Failed to decompress Gzip archive. The file might be corrupted.';
    }
    
    $offset = 0;
    $len = strlen($data);
    $long_filename = null;
    
    while ($offset < $len) {
        $header = substr($data, $offset, 512);
        if (strlen($header) < 512 || pack("a512", $header) === pack("a512", "")) {
            break;
        }
        
        $filename = trim(substr($header, 0, 100), "\0 ");
        $filesize = octdec(trim(substr($header, 124, 12), "\0 "));
        $typeflag = substr($header, 156, 1);
        
        $offset += 512;
        
        if ($typeflag === 'L') {
            // GNU long filename extension
            $long_filename = trim(substr($data, $offset, $filesize), "\0 ");
            $offset += ceil($filesize / 512) * 512;
            continue;
        }
        
        // Use long filename if available from the previous block
        if ($long_filename !== null) {
            $filename = $long_filename;
            $long_filename = null;
        }
        
        // Normalize filename paths (replace Windows backslashes and remove leading ./ or /)
        $filename = str_replace('\\', '/', $filename);
        $filename = ltrim($filename, './');

        // Skip empty filenames or paths attempting directory traversal
        if ($filename === '' || strpos($filename, '..') !== false) {
            $offset += ceil($filesize / 512) * 512;
            continue;
        }
        
        if ($typeflag === '5') {
            // Directory
            $dest = $targetDir . '/' . $filename;
            if (!is_dir($dest)) {
                @mkdir($dest, 0755, true);
            }
        } else if ($typeflag === '0' || $typeflag === "\0" || $typeflag === '') {
            // Regular file
            $dest = $targetDir . '/' . $filename;
            $dir = dirname($dest);
            if (!is_dir($dir)) {
                @mkdir($dir, 0755, true);
            }
            @file_put_contents($dest, substr($data, $offset, $filesize));
        }
        
        $offset += ceil($filesize / 512) * 512;
    }
    return true;
}

// Extract .tar.gz file
$result = extract_tar_gz($uploaded_file, $target_dir);

if ($result === true) {
    // Automatically overwrite root server.js with wrapper script
    $root_server = $home_dir . '/repositories/website/server.js';
    $wrapper = "const fs = require('fs');\nconst path = require('path');\nconst standaloneDir = path.join(__dirname, 'standalone');\nconst standaloneServer = path.join(standaloneDir, 'server.js');\nprocess.env.NODE_PATH = path.join(standaloneDir, 'node_modules') + path.delimiter + (process.env.NODE_PATH || '');\nrequire('module').Module._initPaths();\nif (fs.existsSync(standaloneServer)) {\n  process.chdir(standaloneDir);\n  require(standaloneServer);\n}\n";
    @file_put_contents($root_server, $wrapper);

    // Automatically trigger Passenger restart in both directories
    $paths = [
        $home_dir . '/repositories/website/standalone/tmp/restart.txt',
        $home_dir . '/repositories/website/tmp/restart.txt',
    ];
    foreach ($paths as $restart_file) {
        $dir = dirname($restart_file);
        if (!is_dir($dir)) @mkdir($dir, 0755, true);
        @file_put_contents($restart_file, time());
    }
    echo json_encode(['success' => true, 'message' => 'Deployment successful (extracted via pure PHP TarExtractor)!']);
} else {
    http_response_code(500);
    echo json_encode(['error' => $result]);
}
exit;
