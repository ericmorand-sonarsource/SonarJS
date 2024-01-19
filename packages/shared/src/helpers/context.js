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
exports.setContext = exports.getContext = void 0;
/**
 * The global context
 *
 * It is available anywhere within the bridge as well as in
 * external and custom rules provided their definition sets
 * the `sonar-context` internal parameter.
 */
var context;
/**
 * Returns the global context
 * @returns the global context
 */
function getContext() {
  return context;
}
exports.getContext = getContext;
/**
 * Sets the global context
 * @param ctx the new global context
 */
function setContext(ctx) {
  context = __assign({}, ctx);
}
exports.setContext = setContext;
