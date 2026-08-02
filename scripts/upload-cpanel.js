const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const DEPLOY_URL = process.env.DEPLOY_URL || 'https://colocdz.com/deploy.php';
const TOKEN = 'c8f7a9d2b4e3f5a1c0d9e8b7a6f5e4d3';
const TAR_PATH = path.join(__dirname, '..', 'deploy.tar.gz');

if (!fs.existsSync(TAR_PATH)) {
  console.error('❌ deploy.tar.gz not found! Please run node scripts/package-cpanel.js first.');
  process.exit(1);
}

const fileSize = fs.statSync(TAR_PATH).size;
const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks
const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
const uploadId = 'up_' + Date.now();

console.log(`🚀 Starting chunked upload of deploy.tar.gz (${(fileSize / 1024 / 1024).toFixed(2)} MB in ${totalChunks} chunks) to ${DEPLOY_URL}...`);

async function uploadChunk(chunkIndex) {
  return new Promise((resolve, reject) => {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(fileSize, start + CHUNK_SIZE);
    const chunkBuffer = Buffer.alloc(end - start);

    const fd = fs.openSync(TAR_PATH, 'r');
    fs.readSync(fd, chunkBuffer, 0, end - start, start);
    fs.closeSync(fd);

    const boundary = '--------------------------' + Date.now().toString(16);
    
    let bodyHeader = '';
    bodyHeader += `--${boundary}\r\nContent-Disposition: form-data; name="token"\r\n\r\n${TOKEN}\r\n`;
    bodyHeader += `--${boundary}\r\nContent-Disposition: form-data; name="upload_id"\r\n\r\n${uploadId}\r\n`;
    bodyHeader += `--${boundary}\r\nContent-Disposition: form-data; name="chunk_index"\r\n\r\n${chunkIndex}\r\n`;
    bodyHeader += `--${boundary}\r\nContent-Disposition: form-data; name="total_chunks"\r\n\r\n${totalChunks}\r\n`;
    bodyHeader += `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="deploy.tar.gz"\r\nContent-Type: application/gzip\r\n\r\n`;

    const bodyFooter = `\r\n--${boundary}--\r\n`;
    const payloadLength = Buffer.byteLength(bodyHeader) + chunkBuffer.length + Buffer.byteLength(bodyFooter);

    const urlObj = new URL(DEPLOY_URL);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': payloadLength,
      },
    };

    const client = urlObj.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (e) {
            resolve({ raw: data });
          }
        } else {
          reject(new Error(`Server returned HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(bodyHeader);
    req.write(chunkBuffer);
    req.write(bodyFooter);
    req.end();
  });
}

async function run() {
  for (let i = 0; i < totalChunks; i++) {
    process.stdout.write(`📤 Uploading chunk ${i + 1}/${totalChunks}... `);
    let attempts = 0;
    while (attempts < 3) {
      try {
        const res = await uploadChunk(i);
        console.log('✅ OK');
        if (res.message) {
          console.log(`\n🎉 SERVER RESPONSE: ${res.message} (Extracted ${res.total_extracted || 0} files)`);
        }
        break;
      } catch (err) {
        attempts++;
        console.log(`⚠️ Retry ${attempts}/3: ${err.message}`);
        if (attempts >= 3) throw err;
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }
  console.log('\n🚀 Deployment completed successfully!');
}

run().catch((err) => {
  console.error('\n❌ Deployment failed:', err.message);
  process.exit(1);
});
