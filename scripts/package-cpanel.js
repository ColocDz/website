const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting cPanel Production Package Build...');

// 1. Generate Prisma client & Build Next.js
console.log('📦 Step 1: Running Prisma Generate...');
execSync('npx prisma generate', { stdio: 'inherit' });

console.log('🏗️ Step 2: Building Next.js Standalone app...');
execSync('npx next build', { stdio: 'inherit' });

const standaloneDir = path.join(__dirname, '..', '.next', 'standalone');
const publicDir = path.join(__dirname, '..', 'public');
const nextStaticDir = path.join(__dirname, '..', '.next', 'static');

const targetPublicDir = path.join(standaloneDir, 'public');
const targetNextStaticDir = path.join(standaloneDir, '.next', 'static');

// Helper to copy recursively
function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy public & .next/static into standalone
console.log('📂 Step 3: Copying public directory to standalone/public...');
fs.cpSync(publicDir, targetPublicDir, { recursive: true, force: true });

console.log('🎨 Step 4: Copying .next/static directory to standalone/.next/static...');
fs.cpSync(nextStaticDir, targetNextStaticDir, { recursive: true, force: true });

console.log('⚡ Step 5: Copying Next.js server package into standalone/node_modules...');
const nodeModulesNextDir = path.join(__dirname, '..', 'node_modules', 'next');
const targetNodeModulesNextDir = path.join(standaloneDir, 'node_modules', 'next');
fs.cpSync(nodeModulesNextDir, targetNodeModulesNextDir, { recursive: true, dereference: true, force: true });

const nodeModulesSwcDir = path.join(__dirname, '..', 'node_modules', '@swc', 'helpers');
const targetNodeModulesSwcDir = path.join(standaloneDir, 'node_modules', '@swc', 'helpers');
fs.cpSync(nodeModulesSwcDir, targetNodeModulesSwcDir, { recursive: true, dereference: true, force: true });


// Helper to recursively remove .map files to reduce package size
function removeMapFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      removeMapFiles(fullPath);
    } else if (entry.name.endsWith('.map') || entry.name.endsWith('.d.ts')) {
      try { fs.unlinkSync(fullPath); } catch (e) {}
    }
  }
}

console.log('🧹 Step 6: Stripping unused files and native non-Linux binaries...');
removeMapFiles(standaloneDir);

function cleanupUnusedBinaries(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      cleanupUnusedBinaries(fullPath);
    } else {
      const lower = entry.name.toLowerCase();
      if (
        lower.endsWith('.dll.node') ||
        lower.endsWith('.exe') ||
        lower.endsWith('.darwin-arm64.node') ||
        lower.endsWith('.darwin-x64.node') ||
        lower.endsWith('.win32-x64-msvc.node') ||
        lower.includes('musl') ||
        lower.endsWith('.wasm')
      ) {
        try { fs.unlinkSync(fullPath); } catch (e) {}
      }
    }
  }
}

cleanupUnusedBinaries(standaloneDir);

console.log('✅ Standalone package prepared successfully in .next/standalone!');


console.log('💡 Upload the contents of .next/standalone to /home/colocdz1/repositories/website/standalone on cPanel.');
