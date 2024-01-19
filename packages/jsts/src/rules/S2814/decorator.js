'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.decorate = void 0;
var helpers_1 = require('../helpers');
// core implementation of this rule raises issues on type exports
function decorate(rule) {
  return (0, helpers_1.interceptReport)(rule, reportExempting(isTypeDeclaration));
}
exports.decorate = decorate;
function reportExempting(exemptionCondition) {
  return function (context, reportDescriptor) {
    if ('node' in reportDescriptor) {
      var node = reportDescriptor['node'];
      if (node.type === 'Identifier' && !exemptionCondition(node)) {
        context.report(reportDescriptor);
      }
    }
  };
}
function isTypeDeclaration(node) {
  var _a;
  return (
    ((_a = node.parent) === null || _a === void 0 ? void 0 : _a.type) === 'TSTypeAliasDeclaration'
  );
}
