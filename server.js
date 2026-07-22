const fs = require('fs');
const path = require('path');

const standaloneDir = path.join(__dirname, 'standalone');
const standaloneServer = path.join(standaloneDir, 'server.js');

const Module = require('module');
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function(request, parent, isMain, options) {
  if (request.startsWith('./') || request.startsWith('../')) {
    if (parent && parent.filename && parent.filename.includes('node_modules')) {
      const parentDir = path.dirname(parent.filename);
      const absPath = path.resolve(parentDir, request);
      if (fs.existsSync(absPath) || fs.existsSync(absPath + '.js') || fs.existsSync(absPath + '/index.js') || fs.existsSync(absPath + '.json')) {
        return originalResolveFilename.call(this, absPath, parent, isMain, options);
      }
    }
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
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


