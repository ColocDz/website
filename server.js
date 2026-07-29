const fs = require('fs');
const path = require('path');
const Module = require('module');

const standaloneDir = path.join(__dirname, 'standalone');
process.env.NODE_PATH = path.join(standaloneDir, 'node_modules') + path.delimiter + (process.env.NODE_PATH || '');
Module._initPaths();

const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (typeof request === 'string' && (request.includes('@prisma/client-') || request === '@prisma/client')) {
    try {
      return origResolve.call(this, '@prisma/client', parent, isMain, options);
    } catch (e) {
      const fallback = path.join(standaloneDir, 'node_modules', '@prisma', 'client');
      if (fs.existsSync(fallback)) return origResolve.call(this, fallback, parent, isMain, options);
    }
  }
  return origResolve.call(this, request, parent, isMain, options);
};

process.chdir(standaloneDir);
require(path.join(standaloneDir, 'server.js'));
