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
function decorate(rule) {
  return (0, helpers_1.interceptReport)(rule, function (context, descriptor) {
    var node = descriptor.node;
    var moduleKeyword = context.sourceCode.getFirstToken(node, function (token) {
      return token.value === 'module';
    });
    if (moduleKeyword === null || moduleKeyword === void 0 ? void 0 : moduleKeyword.loc) {
      context.report(__assign(__assign({}, descriptor), { loc: moduleKeyword.loc }));
    } else {
      context.report(descriptor);
    }
  });
}
exports.decorate = decorate;
