import fs from 'fs';
import path from 'path';

async function runAutoDeploy() {
  const token = 'c8f7a9d2b4e3f5a1c0d9e8b7a6f5e4d3';
  const archivePath = path.join(__dirname, '..', 'deploy.tar.gz');

  if (!fs.existsSync(archivePath)) {
    console.error('❌ deploy.tar.gz not found! Please run npm run build:cpanel first.');
    process.exit(1);
  }

  const fileStats = fs.statSync(archivePath);
  console.log(`📦 Found deploy.tar.gz (${(fileStats.size / 1024 / 1024).toFixed(2)} MB)`);

  const fileBuffer = fs.readFileSync(archivePath);
  const formData = new FormData();
  formData.append('token', token);
  formData.append('archive', new Blob([fileBuffer], { type: 'application/gzip' }), 'deploy.tar.gz');

  console.log('🚀 Uploading deploy.tar.gz to https://colocdz.com/deploy.php ...');

  try {
    const res = await fetch('https://colocdz.com/deploy.php', {
      method: 'POST',
      body: formData
    });

    const text = await res.text();
    console.log(`HTTP Status: ${res.status}`);
    console.log('Response Output:\n', text);
  } catch (err: any) {
    console.error('❌ Deployment error:', err.message);
  }
}

runAutoDeploy();
