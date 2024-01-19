'use strict';
var __spreadArray =
  (this && this.__spreadArray) ||
  function (to, from, pack) {
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from));
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.extendRuleConfig = void 0;
var src_1 = require('../../../../shared/src');
var parameters_1 = require('../parameters');
/**
 * Extends an input rule configuration
 *
 * A rule configuration might be extended depending on the rule definition.
 * The purpose of the extension is to activate additional features during
 * linting, e.g., secondary locations.
 *
 * _A rule extension only applies to rules whose implementation is available._
 *
 * @param ruleModule the rule definition
 * @param inputRule the rule configuration
 * @returns the extended rule configuration
 */
function extendRuleConfig(ruleModule, inputRule) {
  var options = __spreadArray([], inputRule.configurations, true);
  if ((0, parameters_1.hasSonarRuntimeOption)(ruleModule, inputRule.key)) {
    options.push(parameters_1.SONAR_RUNTIME);
  }
  if ((0, parameters_1.hasSonarContextOption)(ruleModule, inputRule.key)) {
    options.push((0, src_1.getContext)());
  }
  return options;
}
exports.extendRuleConfig = extendRuleConfig;
