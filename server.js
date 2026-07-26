const fs = require('fs');
const path = require('path');

const standaloneDir = path.join(__dirname, 'standalone');
const standaloneServer = path.join(standaloneDir, 'server.js');

const Module = require('module');

// Hook Node's native Module._findPath to include standalone/node_modules
const originalFindPath = Module._findPath;
Module._findPath = function(request, paths, isMain) {
  const standaloneNodeModules = path.join(standaloneDir, 'node_modules');
  let searchPaths = paths || [];
  if (Array.isArray(searchPaths) && !searchPaths.includes(standaloneNodeModules)) {
    searchPaths = [standaloneNodeModules].concat(searchPaths);
  }
  const result = originalFindPath.call(this, request, searchPaths, isMain);
  if (result) return result;

  // Fallback check directly in standaloneDir/node_modules
  if (typeof request === 'string' && !path.isAbsolute(request) && !request.startsWith('.')) {
    const directPath = path.join(standaloneNodeModules, request);
    const directResult = originalFindPath.call(this, directPath, [], isMain);
    if (directResult) return directResult;
  }

  return originalFindPath.call(this, request, paths, isMain);
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
