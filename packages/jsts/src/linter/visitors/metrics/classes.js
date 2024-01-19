'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.countClasses = void 0;
var helpers_1 = require('./helpers');
/**
 * The ESLint class node types
 */
var CLASS_NODES = ['ClassDeclaration', 'ClassExpression'];
/**
 * Computes the number of classes in the source code
 */
function countClasses(sourceCode) {
  return (0, helpers_1.visitAndCountIf)(sourceCode, function (node) {
    return CLASS_NODES.includes(node.type);
  });
}
exports.countClasses = countClasses;
