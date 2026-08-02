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

// Check if running from project root or inside standalone folder
const subStandalone = path.join(__dirname, 'standalone');
const standaloneDir = fs.existsSync(path.join(subStandalone, 'server.js')) ? subStandalone : __dirname;
const standaloneServer = path.join(standaloneDir, 'server.js');

process.env.NODE_PATH = path.join(standaloneDir, 'node_modules') + path.delimiter + (process.env.NODE_PATH || '');
Module._initPaths();

if (standaloneDir !== __dirname && fs.existsSync(standaloneServer)) {
  process.chdir(standaloneDir);
  require(standaloneServer);
} else {
  // Executing directly inside standalone/server.js
  const nextServer = path.join(__dirname, '.next', 'standalone', 'server.js');
  if (fs.existsSync(nextServer)) {
    require(nextServer);
  }
}
