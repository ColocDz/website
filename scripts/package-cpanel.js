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

// Copy deploy.php into standalone root so deploy.php self-updates on server upon archive extraction
const deployPhpSrc = path.join(__dirname, '..', 'deploy.php');
if (fs.existsSync(deployPhpSrc)) {
  fs.copyFileSync(deployPhpSrc, path.join(standaloneDir, 'deploy.php'));
}

// Copy .env into standalone root
const envSrc = path.join(__dirname, '..', '.env');
if (fs.existsSync(envSrc)) {
  fs.copyFileSync(envSrc, path.join(standaloneDir, '.env'));
}

// Strip heavy face recognition model files from standalone build to ensure upload fits in cPanel PHP memory limit
const standalonePublicModels = path.join(targetPublicDir, 'models');
if (fs.existsSync(standalonePublicModels)) {
  console.log('🧹 Stripping heavy public/models from standalone package...');
  try { fs.rmSync(standalonePublicModels, { recursive: true, force: true }); } catch (e) {}
}

console.log('🎨 Step 4: Copying .next/static directory to standalone/.next/static...');
fs.cpSync(nextStaticDir, targetNextStaticDir, { recursive: true, force: true });

console.log('📋 Step 4.5: Copying Next.js BUILD_ID and manifest files to standalone/.next...');
const dotNextDir = path.join(__dirname, '..', '.next');
const targetDotNextDir = path.join(standaloneDir, '.next');
const nextFiles = fs.readdirSync(dotNextDir);
for (const file of nextFiles) {
  const srcFile = path.join(dotNextDir, file);
  if (fs.statSync(srcFile).isFile()) {
    fs.copyFileSync(srcFile, path.join(targetDotNextDir, file));
  }
}

console.log('🔧 Step 4.8: Injecting Passenger setup into standalone/server.js...');
const standaloneServerFile = path.join(standaloneDir, 'server.js');
const originalContent = fs.readFileSync(standaloneServerFile, 'utf8');

const setupHeader = `(function() {
  const fs = require('fs');
  const path = require('path');
  const standaloneDir = __dirname;
  const deploySrc = path.join(standaloneDir, 'deploy.php');
  const deployDest = path.resolve(standaloneDir, '../../../public_html/deploy.colocdz.com/deploy.php');
  if (fs.existsSync(deploySrc)) {
    try { fs.copyFileSync(deploySrc, deployDest); } catch (e) {}
  }
  const Module = require('module');
  const origResolve = Module._resolveFilename;
  Module._resolveFilename = function (request, parent, isMain, options) {
    if (typeof request === 'string' && request.includes('@prisma/client-')) {
      return origResolve.call(this, '@prisma/client', parent, isMain, options);
    }
    return origResolve.call(this, request, parent, isMain, options);
  };
  process.env.NODE_PATH = path.join(standaloneDir, 'node_modules') + path.delimiter + (process.env.NODE_PATH || '');
  Module._initPaths();
  process.env.NODE_ENV = 'production';
  process.chdir(standaloneDir);
})();

`;

if (!originalContent.includes('deployDest')) {
  fs.writeFileSync(standaloneServerFile, setupHeader + originalContent, 'utf8');
}

// Remove top-level 'next' directory inside standalone if present to prevent require('next') collision
const standaloneNextFolder = path.join(standaloneDir, 'next');
if (fs.existsSync(standaloneNextFolder)) {
  fs.rmSync(standaloneNextFolder, { recursive: true, force: true });
}

// Helper for Windows long paths
function getLongPath(p) {
  const resolved = path.resolve(p);
  if (process.platform === 'win32' && !resolved.startsWith('\\\\?\\')) {
    return '\\\\?\\' + resolved;
  }
  return resolved;
}

console.log('⚡ Step 5: Copying Next.js server package into standalone/node_modules...');
const nodeModulesNextDir = path.join(__dirname, '..', 'node_modules', 'next');
const targetNodeModulesNextDir = path.join(standaloneDir, 'node_modules', 'next');
fs.rmSync(getLongPath(targetNodeModulesNextDir), { recursive: true, force: true });
fs.cpSync(getLongPath(nodeModulesNextDir), getLongPath(targetNodeModulesNextDir), { recursive: true, dereference: true, force: true });

const nodeModulesSwcDir = path.join(__dirname, '..', 'node_modules', '@swc', 'helpers');
const targetNodeModulesSwcDir = path.join(standaloneDir, 'node_modules', '@swc', 'helpers');
fs.cpSync(getLongPath(nodeModulesSwcDir), getLongPath(targetNodeModulesSwcDir), { recursive: true, dereference: true, force: true });

console.log('⚡ Step 5.2: Copying Prisma Client packages into standalone/node_modules...');
const nodeModulesPrismaDir = path.join(__dirname, '..', 'node_modules', '@prisma');
const targetNodeModulesPrismaDir = path.join(standaloneDir, 'node_modules', '@prisma');
if (fs.existsSync(nodeModulesPrismaDir)) {
  fs.cpSync(getLongPath(nodeModulesPrismaDir), getLongPath(targetNodeModulesPrismaDir), { recursive: true, dereference: true, force: true });
}

const nodeModulesDotPrismaDir = path.join(__dirname, '..', 'node_modules', '.prisma');
const targetNodeModulesDotPrismaDir = path.join(standaloneDir, 'node_modules', '.prisma');
if (fs.existsSync(nodeModulesDotPrismaDir)) {
  fs.cpSync(getLongPath(nodeModulesDotPrismaDir), getLongPath(targetNodeModulesDotPrismaDir), { recursive: true, dereference: true, force: true });
}


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
      const lowerName = entry.name.toLowerCase();
      if (lowerName === '__tests__' || lowerName === 'test' || lowerName === 'tests' || lowerName === 'docs' || lowerName === 'example' || lowerName === 'examples') {
        try { fs.rmSync(fullPath, { recursive: true, force: true }); } catch (e) {}
      } else {
        cleanupUnusedBinaries(fullPath);
      }
    } else {
      const lower = entry.name.toLowerCase();
      if (
        (entry.name.startsWith('libquery_engine-') && !entry.name.includes('openssl-1.0') && !entry.name.includes('openssl-3.0')) ||
        lower.endsWith('.dll.node') ||
        lower.endsWith('.exe') ||
        lower.endsWith('.darwin-arm64.node') ||
        lower.endsWith('.darwin-x64.node') ||
        lower.endsWith('.win32-x64-msvc.node') ||
        lower.includes('musl') ||
        lower.endsWith('.wasm') ||
        lower.endsWith('.map') ||
        lower.endsWith('.d.ts') ||
        lower.endsWith('.md') ||
        lower.endsWith('.png') ||
        lower.endsWith('.jpg') ||
        lower.includes('query_engine-windows')
      ) {
        try { fs.unlinkSync(fullPath); } catch (e) {}
      }
    }
  }
}

// Extra cleanup for build-time compiler packages inside next/dist/compiled
const nextCompiledDir = path.join(standaloneDir, 'node_modules', 'next', 'dist', 'compiled');
if (fs.existsSync(nextCompiledDir)) {
  const compilerDirsToStrip = ['terser', 'babel', 'cssnano', 'browserslist', 'caniuse-lite'];
  for (const cDir of compilerDirsToStrip) {
    const p = path.join(nextCompiledDir, cDir);
    if (fs.existsSync(p)) {
      try { fs.rmSync(p, { recursive: true, force: true }); } catch (e) {}
    }
  }
}

// Remove redundant Prisma query engine binaries from standalone/node_modules
function cleanPrismaEngines(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      cleanPrismaEngines(fullPath);
    } else {
      const name = entry.name;
      if (
        name.endsWith('.dll.node') ||
        name.endsWith('.exe') ||
        name.includes('darwin-arm64') ||
        name.includes('darwin-x64') ||
        name.includes('win32-x64') ||
        name.includes('musl') ||
        (name.startsWith('libquery_engine-') && !name.includes('openssl-1.0'))
      ) {
        try { fs.unlinkSync(fullPath); } catch (e) {}
      }
    }
  }
}

cleanPrismaEngines(path.join(standaloneDir, 'node_modules'));

console.log('🧹 Step 6.5: Deleting incomplete top-level standalone/next folder...');
const standaloneNextDir = path.join(standaloneDir, 'next');
if (fs.existsSync(standaloneNextDir)) {
  fs.rmSync(standaloneNextDir, { recursive: true, force: true });
}

console.log('📦 Step 7: Creating deploy.tar.gz archive...');
const archivePath = path.join(__dirname, '..', 'deploy.tar.gz');
if (fs.existsSync(archivePath)) {
  try { fs.unlinkSync(archivePath); } catch (e) {}
}
execSync(`tar -czf "${archivePath}" -C "${standaloneDir}" .`, { stdio: 'inherit' });

console.log('✅ Standalone package & deploy.tar.gz prepared successfully!');
console.log('💡 Upload deploy.tar.gz to /home/colocdz1/repositories/website/standalone via deploy.php');

