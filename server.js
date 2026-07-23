const fs = require('fs');
const path = require('path');

const standaloneDir = path.join(__dirname, 'standalone');
const standaloneServer = path.join(standaloneDir, 'server.js');

const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(request) {
  if (typeof request === 'string') {
    if (request.startsWith('./') || request.startsWith('../')) {
      if (this && this.filename && this.filename.includes('node_modules')) {
        const parentDir = path.dirname(this.filename);
        const absPath = path.resolve(parentDir, request);
        return originalRequire.call(this, absPath);
      }
    } else if (!path.isAbsolute(request)) {
      const standaloneModule = path.join(standaloneDir, 'node_modules', request);
      if (fs.existsSync(standaloneModule) || fs.existsSync(standaloneModule + '.js') || fs.existsSync(standaloneModule + '/package.json')) {
        return originalRequire.call(this, standaloneModule);
      }
    }
  }
  return originalRequire.call(this, request);
};

process.env.NODE_PATH = path.join(standaloneDir, 'node_modules') + path.delimiter + (process.env.NODE_PATH || '');
Module._initPaths();

if (fs.existsSync(standaloneServer)) {
  process.chdir(standaloneDir);
  require(standaloneServer);
} else {
  const { createServer } = require('http');
  const next = require('next');

  const app = next({ dev: false });
  const handle = app.getRequestHandler();

  app.prepare().then(() => {
    createServer((req, res) => handle(req, res)).listen(process.env.PORT || 3000);
  });
}


