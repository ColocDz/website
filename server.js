const path = require('path');
const standaloneDir = path.join(__dirname, 'standalone');
process.chdir(standaloneDir);
require(path.join(standaloneDir, 'server.js'));
