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
define('TARGET_DIR_NAME', 'repositories/website/standalone');

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
    echo "\n--- Contents of repositories/website/server.js ---\n";
    $root_s = $home . '/repositories/website/server.js';
    echo file_exists($root_s) ? file_get_contents($root_s) : "File not found";
    echo "\n--- Content of repositories/website/server.js ---\n";
    $rs = $home . '/repositories/website/server.js';
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

// Direct fix for root server.js wrapper
if (isset($_GET['action']) && $_GET['action'] === 'fix_wrapper') {
    header('Content-Type: text/plain');
    $home = get_user_home();
    $root_server = $home . '/repositories/website/server.js';
    $wrapper = "const fs = require('fs');\nconst path = require('path');\nconst Module = require('module');\nconst standaloneDir = path.join(__dirname, 'standalone');\nconst standaloneNodeModules = path.join(standaloneDir, 'node_modules');\nprocess.env.NODE_PATH = standaloneNodeModules + path.delimiter + (process.env.NODE_PATH || '');\nModule._initPaths();\nconst originalRequire = Module.prototype.require;\nModule.prototype.require = function(request) {\n  if (request === 'next' || request.startsWith('next/')) {\n    const nextStandalonePath = path.join(standaloneNodeModules, request);\n    try { return originalRequire.call(this, nextStandalonePath); } catch (e) {}\n  }\n  if (typeof request === 'string' && (request.startsWith('./') || request.startsWith('../'))) {\n    if (this && this.filename) {\n      const parentDir = path.dirname(this.filename);\n      const absPath = path.resolve(parentDir, request);\n      if (!fs.existsSync(absPath)) {\n        if (fs.existsSync(absPath + '.js')) {\n          return originalRequire.call(this, absPath + '.js');\n        } else if (fs.existsSync(absPath + '/index.js')) {\n          return originalRequire.call(this, absPath + '/index.js');\n        } else if (fs.existsSync(absPath + '.json')) {\n          return originalRequire.call(this, absPath + '.json');\n        }\n      }\n    }\n  }\n  return originalRequire.call(this, request);\n};\nconst standaloneServer = path.join(standaloneDir, 'server.js');\nif (fs.existsSync(standaloneServer)) {\n  process.chdir(standaloneDir);\n  const rawPort = process.env.PORT;\n  if (rawPort && isNaN(Number(rawPort))) {\n    const origParseInt = global.parseInt;\n    global.parseInt = function(val, radix) {\n      if (val === rawPort) return rawPort;\n      return origParseInt(val, radix);\n    };\n    require(standaloneServer);\n    global.parseInt = origParseInt;\n  } else {\n    require(standaloneServer);\n  }\n}\n";
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
// Programmatic git pull & restart
if (isset($_GET['action']) && $_GET['action'] === 'git_pull') {
    header('Content-Type: text/plain');
    $home = get_user_home();
    $repo = $home . '/repositories/website';
    $cmd = "cd " . escapeshellarg($repo) . " && git pull origin main 2>&1";
    $output = shell_exec($cmd);
    echo "--- Git Pull Output ---\n" . $output . "\n";
    
    // Automatically overwrite root server.js with wrapper script
    $root_server = $repo . '/server.js';
    $wrapper = "const fs = require('fs');\nconst path = require('path');\nconst Module = require('module');\nconst standaloneDir = path.join(__dirname, 'standalone');\nconst standaloneNodeModules = path.join(standaloneDir, 'node_modules');\nprocess.env.NODE_PATH = standaloneNodeModules + path.delimiter + (process.env.NODE_PATH || '');\nModule._initPaths();\nconst originalRequire = Module.prototype.require;\nModule.prototype.require = function(request) {\n  if (request === 'next' || request.startsWith('next/')) {\n    const nextStandalonePath = path.join(standaloneNodeModules, request);\n    try { return originalRequire.call(this, nextStandalonePath); } catch (e) {}\n  }\n  if (typeof request === 'string' && (request.startsWith('./') || request.startsWith('../'))) {\n    if (this && this.filename) {\n      const parentDir = path.dirname(this.filename);\n      const absPath = path.resolve(parentDir, request);\n      if (!fs.existsSync(absPath)) {\n        if (fs.existsSync(absPath + '.js')) {\n          return originalRequire.call(this, absPath + '.js');\n        } else if (fs.existsSync(absPath + '/index.js')) {\n          return originalRequire.call(this, absPath + '/index.js');\n        } else if (fs.existsSync(absPath + '.json')) {\n          return originalRequire.call(this, absPath + '.json');\n        }\n      }\n    }\n  }\n  return originalRequire.call(this, request);\n};\nconst standaloneServer = path.join(standaloneDir, 'server.js');\nif (fs.existsSync(standaloneServer)) {\n  process.chdir(standaloneDir);\n  const rawPort = process.env.PORT;\n  if (rawPort && isNaN(Number(rawPort))) {\n    const origParseInt = global.parseInt;\n    global.parseInt = function(val, radix) {\n      if (val === rawPort) return rawPort;\n      return origParseInt(val, radix);\n    };\n    require(standaloneServer);\n    global.parseInt = origParseInt;\n  } else {\n    require(standaloneServer);\n  }\n}\n";
    @file_put_contents($root_server, $wrapper);

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
    echo "--- Restart Triggered ---\n";
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

// Helper to forcefully wipe target directory except .env
function clean_dir_force($dir) {
    if (!is_dir($dir)) return;
    $items = array_diff(scandir($dir), ['.', '..', '.env']);
    foreach ($items as $item) {
        $path = $dir . '/' . $item;
        if (is_dir($path)) {
            clean_dir_force($path);
            @chmod($path, 0777);
            @rmdir($path);
        } else {
            @chmod($path, 0666);
            @unlink($path);
        }
    }
}

// Kill all stale Node processes for user to force Passenger to re-spawn
if (isset($_GET['action']) && $_GET['action'] === 'kill_passenger') {
    header('Content-Type: text/plain');
    @exec("pkill -9 -u colocdz1 -f node");
    $home = get_user_home();
    @file_put_contents($home . '/repositories/website/standalone/tmp/restart.txt', time());
    @file_put_contents($home . '/repositories/website/tmp/restart.txt', time());
    echo "Killed all stale Node processes and touched restart.txt!\n";
    exit;
}
if (isset($_GET['action']) && $_GET['action'] === 'wipe_standalone') {
    header('Content-Type: text/plain');
    $home = get_user_home();
    $target = $home . '/' . TARGET_DIR_NAME;
    clean_dir_force($target);
    echo "Wiped " . $target . " cleanly (preserved .env)!\n";
    print_r(scandir($target));
    exit;
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
clean_dir_force($target_dir);

$uploaded_file = $_FILES['file']['tmp_name'];

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
        $prefix = trim(substr($header, 345, 155), "\0 ");
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
    // Self-update deploy.php script in public_html/deploy.colocdz.com if present in package
    $extracted_deploy = $target_dir . '/deploy.php';
    $public_deploy = $home_dir . '/public_html/deploy.colocdz.com/deploy.php';
    if (file_exists($extracted_deploy) && is_file($extracted_deploy)) {
        @chmod($public_deploy, 0777);
        if (function_exists('opcache_invalidate')) {
            @opcache_invalidate($public_deploy, true);
            @opcache_invalidate($extracted_deploy, true);
        }
        @unlink($public_deploy);
        @copy($extracted_deploy, $public_deploy);
        @chmod($public_deploy, 0755);
    }

    // Remove top-level standalone/next directory to prevent require('next') collision
    $top_next = $target_dir . '/next';
    if (is_dir($top_next)) {
        function rrmdir_clean($dir) {
            if (is_dir($dir)) {
                $objects = scandir($dir);
                foreach ($objects as $object) {
                    if ($object != "." && $object != "..") {
                        if (is_dir($dir . "/" . $object)) rrmdir_clean($dir . "/" . $object);
                        else @unlink($dir . "/" . $object);
                    }
                }
                @rmdir($dir);
            }
        }
        rrmdir_clean($top_next);
    }

    // Automatically overwrite root server.js with wrapper script
    $root_server = $home_dir . '/repositories/website/server.js';
    $wrapper = "const path = require('path');\nconst standaloneDir = path.join(__dirname, 'standalone');\nprocess.chdir(standaloneDir);\nrequire(path.join(standaloneDir, 'server.js'));\n";
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
