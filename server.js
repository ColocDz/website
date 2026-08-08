const fs = require('fs');
const path = require('path');
const http = require('http');
const Module = require('module');

// Intercept http.Server.prototype.listen for Phusion Passenger named pipe sockets
const origListen = http.Server.prototype.listen;
http.Server.prototype.listen = function(...args) {
  const passengerPort = process.env.PORT;
  if (passengerPort && isNaN(Number(passengerPort))) {
    if (typeof args[0] === 'number' || (typeof args[0] === 'string' && isNaN(Number(args[0])))) {
      args[0] = passengerPort;
      if (typeof args[1] === 'string') {
        args.splice(1, 1);
      }
    }
  }
  return origListen.apply(this, args);
};

const originalRequire = Module.prototype.require;
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

if (fs.existsSync(standaloneServer)) {
  process.env.NODE_PATH = path.join(standaloneDir, 'node_modules') + path.delimiter + (process.env.NODE_PATH || '');
  Module._initPaths();
  process.chdir(standaloneDir);
  require(standaloneServer);
} else {
  const nextServer = path.join(__dirname, '.next', 'standalone', 'server.js');
  if (fs.existsSync(nextServer)) {
    process.chdir(path.join(__dirname, '.next', 'standalone'));
    require(nextServer);
  } else {
    const next = require('next');
    const app = next({ dev: false });
    const handle = app.getRequestHandler();

    app.prepare().then(() => {
      http.createServer((req, res) => handle(req, res)).listen(process.env.PORT || 3000);
    });
  }
}
