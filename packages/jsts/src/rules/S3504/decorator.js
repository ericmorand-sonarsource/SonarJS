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
var __rest =
  (this && this.__rest) ||
  function (s, e) {
    var t = {};
    for (var p in s)
      if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === 'function')
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
          t[p[i]] = s[p[i]];
      }
    return t;
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.decorate = void 0;
var helpers_1 = require('../helpers');
function decorate(rule) {
  return (0, helpers_1.interceptReport)(rule, function (context, reportDescriptor) {
    if ('node' in reportDescriptor) {
      var node = reportDescriptor.node,
        rest = __rest(reportDescriptor, ['node']);
      var _a = node.declarations,
        firstDecl = _a[0],
        _1 = _a.slice(1);
      var varToken = context.sourceCode.getTokenBefore(firstDecl.id);
      var identifierEnd = firstDecl.id.loc.end;
      if (varToken == null) {
        // impossible
        return;
      }
      context.report(
        __assign(
          {
            loc: {
              start: varToken.loc.start,
              end: identifierEnd,
            },
          },
          rest,
        ),
      );
    }
  });
}
exports.decorate = decorate;
