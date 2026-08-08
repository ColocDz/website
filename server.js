const fs = require('fs');
const path = require('path');
const http = require('http');
const Module = require('module');

const passengerSocket = process.env.PORT;

// Intercept http.Server.prototype.listen for Phusion Passenger named pipe sockets
const origListen = http.Server.prototype.listen;
http.Server.prototype.listen = function(...args) {
  if (passengerSocket && isNaN(Number(passengerSocket))) {
    args[0] = passengerSocket;
    if (typeof args[1] === 'string') {
      args.splice(1, 1);
    }
  }
  return origListen.apply(this, args);
};

if (passengerSocket && isNaN(Number(passengerSocket))) {
  delete process.env.PORT;
}

// Add standalone node_modules to Node.js module resolution search paths
const searchPaths = [
  path.join(__dirname, '.next', 'standalone', 'node_modules'),
  path.join(__dirname, 'standalone', 'node_modules'),
  path.join(__dirname, 'node_modules'),
];
process.env.NODE_PATH = searchPaths.join(path.delimiter) + (process.env.NODE_PATH ? path.delimiter + process.env.NODE_PATH : '');
Module._initPaths();

// Locate standalone server entry point
let standaloneServer = null;
const candidatePaths = [
  path.join(__dirname, '.next', 'standalone', 'server.js'),
  path.join(__dirname, 'standalone', 'server.js')
];

for (const p of candidatePaths) {
  if (fs.existsSync(p)) {
    standaloneServer = p;
    break;
  }
}

if (standaloneServer) {
  const standaloneDir = path.dirname(standaloneServer);
  process.chdir(standaloneDir);
  require(standaloneServer);
} else {
  const next = require('next');
  const app = next({ dev: false });
  const handle = app.getRequestHandler();

  app.prepare().then(() => {
    http.createServer((req, res) => handle(req, res)).listen(passengerSocket || 3000);
  });
}
