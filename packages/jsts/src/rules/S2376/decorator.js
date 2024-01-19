'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.decorate = void 0;
var helpers_1 = require('../helpers');
function decorate(rule) {
  return (0, helpers_1.interceptReport)(rule, reportExempting(isDecoratedSetterWithAngularInput));
}
exports.decorate = decorate;
function reportExempting(exemptionCondition) {
  return function (context, reportDescriptor) {
    if ('node' in reportDescriptor) {
      var def = reportDescriptor['node'];
      if (!exemptionCondition(def)) {
        context.report(reportDescriptor);
      }
    }
  };
}
function isDecoratedSetterWithAngularInput(def) {
  var kind = def.kind,
    decorators = def.decorators;
  return (
    kind === 'set' &&
    decorators !== undefined &&
    decorators.some(function (decorator) {
      return (
        decorator.expression.type === 'CallExpression' &&
        decorator.expression.callee.type === 'Identifier' &&
        decorator.expression.callee.name === 'Input'
      );
    })
  );
}
