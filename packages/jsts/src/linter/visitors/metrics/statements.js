'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.countStatements = void 0;
var helpers_1 = require('./helpers');
/**
 * The ESLint statement node types
 */
var STATEMENT_NODES = [
  'VariableDeclaration',
  'EmptyStatement',
  'ExpressionStatement',
  'IfStatement',
  'DoWhileStatement',
  'WhileStatement',
  'ForInStatement',
  'ForOfStatement',
  'ForStatement',
  'ContinueStatement',
  'BreakStatement',
  'ReturnStatement',
  'WithStatement',
  'SwitchStatement',
  'ThrowStatement',
  'TryStatement',
  'DebuggerStatement',
];
/**
 * Computes the number of statements in the source code
 */
function countStatements(sourceCode) {
  return (0, helpers_1.visitAndCountIf)(sourceCode, function (node) {
    return STATEMENT_NODES.includes(node.type);
  });
}
exports.countStatements = countStatements;
