const fs = require('fs');
const path = require('path');
const Module = require('module');

const standaloneDir = path.join(__dirname, 'standalone');
const standaloneNodeModules = path.join(standaloneDir, 'node_modules');

// 1. Force standalone/node_modules to the top of module resolution
process.env.NODE_PATH = standaloneNodeModules + path.delimiter + (process.env.NODE_PATH || '');
Module._initPaths();

// 2. Intercept require calls to force loading from standalone/node_modules
const originalRequire = Module.prototype.require;
Module.prototype.require = function(request) {
  if (request === 'next' || request.startsWith('next/')) {
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
};

const standaloneServer = path.join(standaloneDir, 'server.js');

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
