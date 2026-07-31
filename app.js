const path = require('path');
const fs = require('fs');

const standaloneDir = path.join(__dirname, 'standalone');

if (fs.existsSync(path.join(standaloneDir, 'server.js'))) {
  process.chdir(standaloneDir);
  require(path.join(standaloneDir, 'server.js'));
} else {
  require('next/dist/bin/next');
}
