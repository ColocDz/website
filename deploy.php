<?php
// ==========================================
// Secure PHP Deployment Script for cPanel
// ==========================================

// 1. CHOOSE A STRONG SECRET TOKEN
// Replace this with a strong random string or use the one generated for you.
// You MUST add this same token as a GitHub Repository Secret named DEPLOY_TOKEN.
define('DEPLOY_TOKEN', 'c8f7a9d2b4e3f5a1c0d9e8b7a6f5e4d3');

// 2. TARGET DIRECTORY
// Relative to your cPanel home directory.
define('TARGET_DIR_NAME', 'repositories/website/colocdz-app');

header('Content-Type: application/json');

// Check token
if (!isset($_POST['token']) || $_POST['token'] !== DEPLOY_TOKEN) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized token']);
    exit;
}

// Check file upload
if (!isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded']);
    exit;
}

$home_dir = dirname($_SERVER['DOCUMENT_ROOT']);
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

$zip_file = $_FILES['file']['tmp_name'];

// Extract ZIP
$zip = new ZipArchive;
if ($zip->open($zip_file) === TRUE) {
    $zip->extractTo($target_dir);
    $zip->close();
    echo json_encode(['success' => true, 'message' => 'Deployment successful!']);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to extract ZIP file on the server. Make sure the ZipArchive extension is enabled in PHP.']);
}
