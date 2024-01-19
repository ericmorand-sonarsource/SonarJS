'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.loadBundles = exports.loadCustomRules = void 0;
var core_1 = require('../rules/core');
var typescript_eslint_1 = require('../rules/typescript-eslint');
var eslint_plugin_sonarjs_1 = require('eslint-plugin-sonarjs');
var eslint_plugin_react_1 = require('eslint-plugin-react');
var eslint_plugin_jsx_a11y_1 = require('eslint-plugin-jsx-a11y');
var eslint_plugin_import_1 = require('eslint-plugin-import');
var rules_1 = require('../rules');
var custom_rules_1 = require('./custom-rules');
var src_1 = require('../../../shared/src');
function loadCustomRules(linter, rules) {
  if (rules === void 0) {
    rules = [];
  }
  for (var _i = 0, rules_2 = rules; _i < rules_2.length; _i++) {
    var rule = rules_2[_i];
    linter.defineRule(rule.ruleId, rule.ruleModule);
  }
}
exports.loadCustomRules = loadCustomRules;
function loadBundles(linter, rulesBundles) {
  for (var _i = 0, rulesBundles_1 = rulesBundles; _i < rulesBundles_1.length; _i++) {
    var bundleId = rulesBundles_1[_i];
    loaders[bundleId](linter);
  }
}
exports.loadBundles = loadBundles;
/**
 * Loaders for each of the predefined rules bundles. Each bundle comes with a
 * different data structure (array/record/object).
 */
var loaders = {
  /**
   * Loads external rules
   *
   * The external ESLint-based rules include all the rules that are
   * not implemented internally, in other words, rules from external
   * dependencies which include ESLint core rules.
   */
  externalRules: function (linter) {
    var externalRules = {};
    /**
     * The order of defining rules from external dependencies is important here.
     * Core ESLint rules could be overridden by the implementation from specific
     * dependencies, which should be the default behaviour in most cases.
     */
    var dependencies = [
      core_1.eslintRules,
      typescript_eslint_1.tsEslintRules,
      eslint_plugin_react_1.rules,
      eslint_plugin_jsx_a11y_1.rules,
      eslint_plugin_import_1.rules,
    ];
    for (var _i = 0, dependencies_1 = dependencies; _i < dependencies_1.length; _i++) {
      var dependencyRules = dependencies_1[_i];
      for (var _a = 0, _b = Object.entries(dependencyRules); _a < _b.length; _a++) {
        var _c = _b[_a],
          name_1 = _c[0],
          module_1 = _c[1];
        externalRules[name_1] = module_1;
      }
    }
    linter.defineRules(externalRules);
  },
  /**
   * Loads plugin rules
   *
   * Adds the rules from the Sonar ESLint plugin.
   */
  pluginRules: function (linter) {
    linter.defineRules(eslint_plugin_sonarjs_1.rules);
  },
  /**
   * Loads internal rules
   *
   * Adds the rules from SonarJS plugin, i.e. rules in path
   * /src/rules
   */
  internalRules: function (linter) {
    linter.defineRules(rules_1.rules);
  },
  /**
   * Loads global context rules
   *
   * Context bundles define a set of external custom rules (like the taint analysis rule)
   * including rule keys and rule definitions that cannot be provided to the linter
   * wrapper using the same feeding channel as rules from the active quality profile.
   */
  contextRules: function (linter) {
    var bundles = (0, src_1.getContext)().bundles;
    var customRules = [];
    for (var _i = 0, bundles_1 = bundles; _i < bundles_1.length; _i++) {
      var ruleBundle = bundles_1[_i];
      var bundle = require(ruleBundle);
      customRules.push.apply(customRules, bundle.rules);
      var ruleIds = bundle.rules.map(function (r) {
        return r.ruleId;
      });
      (0, src_1.debug)('Loaded rules '.concat(ruleIds, ' from ').concat(ruleBundle));
    }
    loadCustomRules(linter, customRules);
  },
  /**
   * Loads internal custom rules
   *
   * These are rules used internally by SonarQube to have the symbol highlighting and
   * the cognitive complexity metrics.
   */
  internalCustomRules: function (linter) {
    loadCustomRules(linter, custom_rules_1.customRules);
  },
};
