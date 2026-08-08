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
  const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
  console.log(`📦 Found deploy.tar.gz (${fileSizeMB} MB)`);

  const chunkSize = 2 * 1024 * 1024; // 2MB chunks to bypass Cloudflare 100s timeout
  const totalChunks = Math.ceil(fileStats.size / chunkSize);
  const uploadId = `up_${Date.now()}`;

  console.log(`🚀 Uploading deploy.tar.gz in ${totalChunks} chunks (2MB each) to https://colocdz.com/deploy.php ...`);

  const fd = fs.openSync(archivePath, 'r');

  for (let i = 0; i < totalChunks; i++) {
    const buffer = Buffer.alloc(Math.min(chunkSize, fileStats.size - i * chunkSize));
    fs.readSync(fd, buffer, 0, buffer.length, i * chunkSize);

    const formData = new FormData();
    formData.append('token', token);
    formData.append('upload_id', uploadId);
    formData.append('chunk_index', i.toString());
    formData.append('total_chunks', totalChunks.toString());
    formData.append('file', new Blob([buffer], { type: 'application/octet-stream' }), `chunk_${i}`);

    console.log(`⏳ Uploading Chunk ${i + 1}/${totalChunks} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)...`);

    try {
      const res = await fetch('https://colocdz.com/deploy.php', {
        method: 'POST',
        body: formData
      });

      const data = await res.json().catch(() => ({ raw: 'Failed to parse JSON' }));
      console.log(`   Chunk ${i + 1}/${totalChunks} Status ${res.status}:`, data);

      if (!res.ok) {
        console.error(`❌ Chunk ${i + 1} failed:`, data);
        fs.closeSync(fd);
        process.exit(1);
      }
    } catch (err: any) {
      console.error(`❌ Network error uploading chunk ${i + 1}:`, err.message);
      fs.closeSync(fd);
      process.exit(1);
    }
  }

  fs.closeSync(fd);
  console.log('✅ All chunks uploaded & extracted successfully on cPanel!');
}

runAutoDeploy();
