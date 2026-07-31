const fs = require('fs');
const path = require('path');

const Module = require('module');
const originalRequire = Module.prototype.require;

// Intercept require to handle relative extensions (.js/.json) for Passenger loader
Module.prototype.require = function(request) {
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

const standaloneDir = path.join(__dirname, 'standalone');
const standaloneServer = path.join(standaloneDir, 'server.js');

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
