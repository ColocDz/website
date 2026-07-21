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

// 2. Copy public & .next/static into standalone
console.log('📂 Step 3: Copying public directory to standalone/public...');
copyDirSync(publicDir, targetPublicDir);

console.log('🎨 Step 4: Copying .next/static directory to standalone/.next/static...');
copyDirSync(nextStaticDir, targetNextStaticDir);

console.log('✅ Standalone package prepared successfully in .next/standalone!');
console.log('💡 Upload the contents of .next/standalone to /home/colocdz1/repositories/website/standalone on cPanel.');
