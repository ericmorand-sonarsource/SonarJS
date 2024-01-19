'use strict';
var __spreadArray =
  (this && this.__spreadArray) ||
  function (to, from, pack) {
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from));
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.computeCyclomaticComplexity = void 0;
var __1 = require('../');
/**
 * The ESLint loop node types
 */
var LOOP_NODES = [
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
  'WhileStatement',
  'DoWhileStatement',
];
/**
 * The ESLint conditional node types
 */
var CONDITIONAL_NODES = ['IfStatement', 'ConditionalExpression', 'SwitchCase'];
/**
 * The ESLint function node types
 */
var FUNCTION_NODES = ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'];
/**
 * The ESLint node types increasing complexity
 */
var COMPLEXITY_NODES = __spreadArray(
  __spreadArray(
    __spreadArray(__spreadArray([], CONDITIONAL_NODES, true), FUNCTION_NODES, true),
    LOOP_NODES,
    true,
  ),
  ['LogicalExpression'],
  false,
);
/**
 * Computes the cyclomatic complexity of an ESLint source code
 * @param sourceCode the ESLint source code
 * @returns the cyclomatic complexity
 */
function computeCyclomaticComplexity(sourceCode) {
  var complexity = 0;
  (0, __1.visit)(sourceCode, function (node) {
    if (COMPLEXITY_NODES.includes(node.type)) {
      complexity++;
    }
  });
  return complexity;
}
exports.computeCyclomaticComplexity = computeCyclomaticComplexity;
