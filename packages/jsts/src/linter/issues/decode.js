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
exports.decodeSonarRuntime = void 0;
var parameters_1 = require('../parameters');
/**
 * Decodes an issue with secondary locations, if any
 *
 * Decoding an issue with secondary locations consists in checking
 * if the rule definition claims using secondary locations by the
 * definition of the `sonar-runtime` internal parameter. If it is
 * the case, secondary locations are then decoded and a well-formed
 * issue is then returned. Otherwise, the original issue is returned
 * unchanged.
 *
 * @param ruleModule the rule definition
 * @param issue the issue to decode
 * @throws a runtime error in case of an invalid encoding
 * @returns the decoded issue (or the original one)
 */
function decodeSonarRuntime(ruleModule, issue) {
  if ((0, parameters_1.hasSonarRuntimeOption)(ruleModule, issue.ruleId)) {
    try {
      var encodedMessage = JSON.parse(issue.message);
      return __assign(__assign({}, issue), encodedMessage);
    } catch (e) {
      throw new Error(
        'Failed to parse encoded issue message for rule '
          .concat(issue.ruleId, ':\n"')
          .concat(issue.message, '". ')
          .concat(e.message),
      );
    }
  }
  return issue;
}
exports.decodeSonarRuntime = decodeSonarRuntime;
