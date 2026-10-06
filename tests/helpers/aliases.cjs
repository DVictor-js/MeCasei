const Module = require("node:module");
const path = require("node:path");
const resolve = Module._resolveFilename;
Module._resolveFilename = function (name, parent, ...args) {
  return resolve.call(this, name.startsWith("@/") ? path.join(__dirname, "../../src", name.slice(2)) : name, parent, ...args);
};
