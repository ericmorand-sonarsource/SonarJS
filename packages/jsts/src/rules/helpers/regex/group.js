'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.extractReferences = void 0;
var __1 = require('../');
function extractReferences(node) {
  var references = [];
  if ((0, __1.isStringLiteral)(node)) {
    var str = node.value;
    var reg = /\$(\d+)|\$<([a-zA-Z]\w*)>/g;
    var match = void 0;
    while ((match = reg.exec(str)) !== null) {
      var raw = match[0],
        index = match[1],
        name_1 = match[2];
      var value = index || name_1;
      references.push({ raw: raw, value: value });
    }
  }
  return references;
}
exports.extractReferences = extractReferences;
