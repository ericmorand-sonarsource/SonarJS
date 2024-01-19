'use strict';
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.decorate = void 0;
var helpers_1 = require('../helpers');
var jsx_ast_utils_1 = require('jsx-ast-utils');
/**
 * This fix was introduced in eslint-plugin-jsx-a11y e6bfd5cb7c,
 * but the last release is almost a year old, so it doesn't include this.
 * When we update the dependency, we can remove this decorator.
 *
 * This will include the removal of:
 * - the `jsx-ast-utils` dependency
 * - its type definition `typings/jsx-ast-utils/index.d.ts`
 * - all files in the `rules/S6827/` directory
 */
function decorate(rule) {
  rule.meta.hasSuggestions = true;
  return (0, helpers_1.interceptReport)(rule, function (context, reportDescriptor) {
    var node = reportDescriptor.node;
    if ((0, jsx_ast_utils_1.hasAnyProp)(node.attributes, ['title', 'aria-label'])) {
      return;
    }
    context.report(__assign({}, reportDescriptor));
  });
}
exports.decorate = decorate;
