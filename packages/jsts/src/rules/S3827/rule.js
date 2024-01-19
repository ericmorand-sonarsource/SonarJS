'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
var parameters_1 = require('../../linter/parameters');
// https://vuejs.org/api/sfc-script-setup.html#defineprops-defineemits
var vueMacroNames = new Set([
  'defineProps',
  'defineEmits',
  'defineExpose',
  'defineOptions',
  'defineSlots',
  'withDefaults',
]);
exports.rule = {
  meta: {
    schema: [
      {
        // internal parameter for rules having secondary locations
        enum: [parameters_1.SONAR_RUNTIME],
      },
    ],
  },
  create: function (context) {
    var excludedNames = new Set();
    var undeclaredIdentifiersByName = new Map();
    return {
      'Program:exit': function () {
        excludedNames.clear();
        undeclaredIdentifiersByName.clear();
        var globalScope = context.getScope();
        globalScope.through.forEach(function (ref) {
          var identifier = ref.identifier;
          if (excludedNames.has(identifier.name)) {
            return;
          }
          if (ref.writeExpr || hasTypeOfOperator(identifier) || isWithinWithStatement(identifier)) {
            excludedNames.add(identifier.name);
            return;
          }
          if (
            vueMacroNames.has(identifier.name) &&
            (0, helpers_1.isInsideVueSetupScript)(identifier, context)
          ) {
            return;
          }
          var undeclaredIndentifiers = undeclaredIdentifiersByName.get(identifier.name);
          if (undeclaredIndentifiers) {
            undeclaredIndentifiers.push(identifier);
          } else {
            undeclaredIdentifiersByName.set(identifier.name, [identifier]);
          }
        });
        undeclaredIdentifiersByName.forEach(function (identifiers, name) {
          context.report({
            node: identifiers[0],
            message: (0, helpers_1.toEncodedMessage)(
              '"'.concat(
                name,
                '" does not exist. Change its name or declare it so that its usage doesn\'t result in a "ReferenceError".',
              ),
              identifiers.slice(1),
            ),
          });
        });
      },
    };
  },
};
function isWithinWithStatement(node) {
  return !!(0, helpers_1.findFirstMatchingAncestor)(node, function (ancestor) {
    return ancestor.type === 'WithStatement';
  });
}
function hasTypeOfOperator(node) {
  var parent = node.parent;
  return (
    (parent === null || parent === void 0 ? void 0 : parent.type) === 'UnaryExpression' &&
    parent.operator === 'typeof'
  );
}
