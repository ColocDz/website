const fs = require('fs');
const path = require('path');

const standaloneDir = path.join(__dirname, 'standalone');
const standaloneServer = path.join(standaloneDir, 'server.js');

const Module = require('module');
const originalRequire = Module.prototype.require;
const nativeLoad = Module._load;

Module.prototype.require = function(request) {
  if (typeof request === 'string') {
    if (request.startsWith('./') || request.startsWith('../')) {
      if (this && this.filename && this.filename.includes('node_modules')) {
        const parentDir = path.dirname(this.filename);
        const absPath = path.resolve(parentDir, request);
        let targetPath = absPath;
        if (!fs.existsSync(targetPath)) {
          if (fs.existsSync(targetPath + '.js')) {
            targetPath += '.js';
          } else if (fs.existsSync(targetPath + '/index.js')) {
            targetPath += '/index.js';
          } else if (fs.existsSync(targetPath + '.json')) {
            targetPath += '.json';
          }
        }
        return nativeLoad(targetPath, this, false);
      }
    } else if (!path.isAbsolute(request)) {
      const standaloneModule = path.join(standaloneDir, 'node_modules', request);
      if (fs.existsSync(standaloneModule) || fs.existsSync(standaloneModule + '.js') || fs.existsSync(standaloneModule + '/package.json')) {
        return nativeLoad(standaloneModule, this, false);
      }
    }
  }
  return originalRequire.call(this, request);
};

process.env.NODE_PATH = path.join(standaloneDir, 'node_modules') + path.delimiter + (process.env.NODE_PATH || '');
Module._initPaths();

if (fs.existsSync(standaloneServer)) {
  process.chdir(standaloneDir);

  const rawPort = process.env.PORT;
  if (rawPort && isNaN(Number(rawPort))) {
    const origParseInt = global.parseInt;
    global.parseInt = function(val, radix) {
      if (val === rawPort) return rawPort;
      return origParseInt(val, radix);
    };
    require(standaloneServer);
    global.parseInt = origParseInt;
  } else {
    require(standaloneServer);
  }
} else {
  const { createServer } = require('http');
  const next = require('next');

  const app = next({ dev: false });
  const handle = app.getRequestHandler();

  app.prepare().then(() => {
    createServer((req, res) => handle(req, res)).listen(process.env.PORT || 3000);
  });
}


