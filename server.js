const path = require('path');
const Module = require('module');

const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (typeof request === 'string' && request.includes('@prisma/client-')) {
    return origResolve.call(this, '@prisma/client', parent, isMain, options);
  }
  return origResolve.call(this, request, parent, isMain, options);
};

const standaloneDir = path.join(__dirname, 'standalone');
process.env.NODE_PATH = path.join(standaloneDir, 'node_modules') + path.delimiter + (process.env.NODE_PATH || '');
Module._initPaths();
process.chdir(standaloneDir);
require(path.join(standaloneDir, 'server.js'));
