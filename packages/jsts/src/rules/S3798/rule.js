'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
exports.rule = {
  meta: {
    messages: {
      defineLocally:
        'Define this declaration in a local scope or bind explicitly the property to the global object.',
    },
  },
  create: function (context) {
    return {
      Program: function () {
        var scope = context.getScope();
        // As we parse every file with "module" source type, we find user defined global variables in the module scope
        var moduleScope = findModuleScope(context);
        moduleScope === null || moduleScope === void 0
          ? void 0
          : moduleScope.variables.forEach(function (variable) {
              var _a;
              if (
                scope.variables.find(function (global) {
                  return global.name === variable.name;
                })
              ) {
                // Avoid reporting on redefinitions of actual global variables
                return;
              }
              for (var _i = 0, _b = variable.defs; _i < _b.length; _i++) {
                var def = _b[_i];
                var defNode = def.node;
                if (
                  def.type === 'FunctionName' ||
                  (def.type === 'Variable' &&
                    ((_a = def.parent) === null || _a === void 0 ? void 0 : _a.kind) === 'var' &&
                    !isRequire(def.node.init))
                ) {
                  context.report({
                    node: defNode,
                    messageId: 'defineLocally',
                  });
                  return;
                }
              }
            });
      },
    };
  },
};
function findModuleScope(context) {
  return context.sourceCode.scopeManager.scopes.find(function (s) {
    return s.type === 'module';
  });
}
function isRequire(node) {
  return (
    (node === null || node === void 0 ? void 0 : node.type) === 'CallExpression' &&
    node.arguments.length === 1 &&
    (0, helpers_1.isIdentifier)(node.callee, 'require')
  );
}
