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
exports.createLinterConfig = void 0;
var src_1 = require('../../../../shared/src');
var custom_rules_1 = require('../custom-rules');
var rule_config_1 = require('./rule-config');
/**
 * Creates an ESLint linting configuration
 *
 * A linter configuration is created based on the input rules enabled by
 * the user through the active quality profile and the rules provided by
 * the linter wrapper.
 *
 * The configuration includes the rules with their configuration that are
 * used during linting as well as the global variables and the JavaScript
 * execution environments defined through the analyzer's properties.
 *
 * @param inputRules the rules from the active quality profile
 * @param linterRules the wrapper's rule database
 * @param environments the JavaScript execution environments
 * @param globs the global variables
 * @returns the created ESLint linting configuration
 */
function createLinterConfig(inputRules, linterRules, environments, globs) {
  if (environments === void 0) {
    environments = [];
  }
  if (globs === void 0) {
    globs = [];
  }
  var env = createEnv(environments);
  var globals = createGlobals(globs);
  var parserOptions = { sourceType: 'module', ecmaVersion: 2018 };
  var config = {
    env: env,
    globals: globals,
    parserOptions: parserOptions,
    rules: {},
    /* using "max" version to prevent `eslint-plugin-react` from printing a warning */
    settings: { react: { version: '999.999.999' } },
  };
  enableRules(config, inputRules, linterRules);
  enableInternalCustomRules(config);
  return config;
}
exports.createLinterConfig = createLinterConfig;
/**
 * Creates an ESLint execution environments configuration
 * @param environments the JavaScript execution environments to enable
 * @returns a configuration of JavaScript execution environments
 */
function createEnv(environments) {
  var env = { es6: true };
  for (var _i = 0, environments_1 = environments; _i < environments_1.length; _i++) {
    var key = environments_1[_i];
    env[key] = true;
  }
  return env;
}
/**
 * Creates an ESLint global variables configuration
 * @param globs the global variables to enable
 * @returns a configuration of global variables
 */
function createGlobals(globs) {
  var globals = {};
  for (var _i = 0, globs_1 = globs; _i < globs_1.length; _i++) {
    var key = globs_1[_i];
    globals[key] = true;
  }
  return globals;
}
/**
 * Enables input rules
 *
 * Enabling an input rule is similar to how rule enabling works with ESLint.
 * However, in the particular case of internal rules, the rule configuration
 * can be decorated with special markers to activate internal features.
 *
 * For example, an ESLint rule configuration for a rule that reports secondary
 * locations would be `["error", "sonar-runtime"]`, where the "sonar-runtime"`
 * is a marker for a post-linting processing to decode such locations.
 *
 * @param config the configuration to augment with rule enabling
 * @param inputRules the input rules to enable
 * @param linterRules the linter rules available
 */
function enableRules(config, inputRules, linterRules) {
  for (var _i = 0, inputRules_1 = inputRules; _i < inputRules_1.length; _i++) {
    var inputRule = inputRules_1[_i];
    var ruleModule = linterRules.get(inputRule.key);
    config.rules[inputRule.key] = __spreadArray(
      ['error'],
      (0, rule_config_1.extendRuleConfig)(ruleModule, inputRule),
      true,
    );
  }
}
/**
 * Enables internal custom rules in the provided configuration
 *
 * Custom rules like cognitive complexity and symbol highlighting
 * are always enabled as part of metrics computation. Such rules
 * are, therefore, added in the linting configuration by default.
 *
 * _Internal custom rules are not enabled in SonarLint context._
 *
 * @param config the configuration to augment with custom rule enabling
 */
function enableInternalCustomRules(config) {
  if (!(0, src_1.getContext)().sonarlint) {
    for (
      var _i = 0, internalCustomRules_1 = custom_rules_1.customRules;
      _i < internalCustomRules_1.length;
      _i++
    ) {
      var internalCustomRule = internalCustomRules_1[_i];
      config.rules[internalCustomRule.ruleId] = __spreadArray(
        ['error'],
        internalCustomRule.ruleConfig,
        true,
      );
    }
  }
}
