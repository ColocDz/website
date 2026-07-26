const fs = require('fs');
const path = require('path');
const Module = require('module');

const standaloneDir = path.join(__dirname, 'standalone');
const standaloneNodeModules = path.join(standaloneDir, 'node_modules');

process.env.NODE_PATH = standaloneNodeModules + path.delimiter + (process.env.NODE_PATH || '');

const originalRequire = Module.prototype.require;
const nativeRequire = Module.createRequire ? Module.createRequire(__filename) : originalRequire;

let inCustomRequire = false;
Module.prototype.require = function(request) {
  if (inCustomRequire) {
    return originalRequire.call(this, request);
  }
  inCustomRequire = true;
  try {
    if (request === 'next' || (typeof request === 'string' && request.startsWith('next/'))) {
      const nextStandalonePath = path.join(standaloneNodeModules, request);
      try {
        return originalRequire.call(this, nextStandalonePath);
      } catch (e) {}
    }
    if (typeof request === 'string' && (request.startsWith('./') || request.startsWith('../'))) {
      if (this && this.filename) {
        const parentDir = path.dirname(this.filename);
        const absPath = path.resolve(parentDir, request);
        if (!fs.existsSync(absPath)) {
          if (fs.existsSync(absPath + '.js')) {
            return originalRequire.call(this, absPath + '.js');
          } else if (fs.existsSync(absPath + '/index.js')) {
            return originalRequire.call(this, absPath + '/index.js');
          } else if (fs.existsSync(absPath + '.json')) {
            return originalRequire.call(this, absPath + '.json');
          }
        }
      }
    }
    return originalRequire.call(this, request);
  } finally {
    inCustomRequire = false;
  }
};

const standaloneServer = path.join(standaloneDir, 'server.js');

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
