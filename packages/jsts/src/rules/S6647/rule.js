'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var core_1 = require('../core');
var decorator_1 = require('./decorator');
/**
 * Check if method with accessibility is not useless
 */
function checkAccessibility(node) {
  switch (node.accessibility) {
    case 'protected':
    case 'private':
      return false;
    case 'public':
      if (
        node.parent.type === 'ClassBody' &&
        'superClass' in node.parent.parent &&
        node.parent.parent.superClass
      ) {
        return false;
      }
      break;
  }
  return true;
}
/**
 * Check if method is not useless due to typescript parameter properties and decorators
 */
function checkParams(node) {
  return !node.value.params.some(function (param) {
    var _a;
    return (
      param.type === 'TSParameterProperty' ||
      ((_a = param.decorators) === null || _a === void 0 ? void 0 : _a.length) > 0
    );
  });
}
var eslintNoUselessConstructor = core_1.eslintRules['no-useless-constructor'];
var originalRule = {
  meta: {
    hasSuggestions: true,
    messages: eslintNoUselessConstructor.meta.messages,
  },
  create: function (context) {
    var rules = eslintNoUselessConstructor.create(context);
    return {
      MethodDefinition: function (node) {
        if (
          node.value.type === 'FunctionExpression' &&
          node.kind === 'constructor' &&
          checkAccessibility(node) &&
          checkParams(node)
        ) {
          rules.MethodDefinition(node);
        }
      },
    };
  },
};
exports.rule = (0, decorator_1.decorate)(originalRule);
