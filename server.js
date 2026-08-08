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

// Register all potential node_modules candidate paths into Node CommonJS search paths
const nodeModulesCandidates = [
  path.join(__dirname, 'node_modules'),
  path.join(__dirname, 'standalone', 'node_modules'),
  path.join(__dirname, '.next', 'standalone', 'node_modules')
];

for (const nm of nodeModulesCandidates) {
  if (fs.existsSync(nm)) {
    if (!module.paths.includes(nm)) {
      module.paths.unshift(nm);
    }
    if (require.main && !require.main.paths.includes(nm)) {
      require.main.paths.unshift(nm);
    }
  }
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
  process.chdir(standaloneDir);
  require(standaloneServer);
} else {
  try {
    const next = require('next');
    const app = next({ dev: false, dir: __dirname });
    const handle = app.getRequestHandler();

    app.prepare().then(() => {
      http.createServer((req, res) => handle(req, res)).listen(passengerSocket || 3000);
    });
  } catch (e) {
    console.error('Failed to start Next.js server:', e);
  }
}

