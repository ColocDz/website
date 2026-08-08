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

// Locate standalone server entry point
let standaloneServer = null;
const candidatePaths = [
  path.join(__dirname, 'standalone', 'server.js'),
  path.join(__dirname, '.next', 'standalone', 'server.js')
];

for (const p of candidatePaths) {
  if (fs.existsSync(p)) {
    standaloneServer = p;
    break;
  }
}

if (standaloneServer) {
  const standaloneDir = path.dirname(standaloneServer);
  const standaloneNodeModules = path.join(standaloneDir, 'node_modules');

  // Push standalone/node_modules directly into module search paths
  if (fs.existsSync(standaloneNodeModules)) {
    if (!module.paths.includes(standaloneNodeModules)) {
      module.paths.unshift(standaloneNodeModules);
    }
    if (require.main && !require.main.paths.includes(standaloneNodeModules)) {
      require.main.paths.unshift(standaloneNodeModules);
    }
  }

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
