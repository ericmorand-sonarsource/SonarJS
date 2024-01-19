'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.decorate = void 0;
var helpers_1 = require('../helpers');
// core implementation of this rule raises issues on binary expressions with string literal operand(s)
function decorate(rule) {
  return (0, helpers_1.interceptReport)(rule, reportExempting(isTwoOperands));
}
exports.decorate = decorate;
function reportExempting(exemptionCondition) {
  return function (context, reportDescriptor) {
    if ('node' in reportDescriptor) {
      var expr = reportDescriptor['node'];
      if (!exemptionCondition(expr)) {
        context.report(reportDescriptor);
      }
    }
  };
}
function isTwoOperands(node) {
  return node.right.type !== 'BinaryExpression' && node.left.type !== 'BinaryExpression';
}
