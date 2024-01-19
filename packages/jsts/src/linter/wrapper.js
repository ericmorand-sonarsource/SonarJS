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
exports.LinterWrapper = void 0;
/*
 * SonarQube JavaScript Plugin
 * Copyright (C) 2011-2024 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
var eslint_1 = require('eslint');
var bundle_loader_1 = require('./bundle-loader');
var config_1 = require('./config');
var src_1 = require('../../../shared/src');
var issues_1 = require('./issues');
/**
 * When a linter is created, by default all these bundles of rules will
 * be loaded into the linter internal rules map. This behaviour can be
 * adjusted by passing which bundles, if any, should be loaded instead.
 * The order of this array is important here. Rules from a previous bundle
 * will be overridden by the implementation of the same rule key in a
 * subsequent bundle.
 */
var defaultRuleBundles = [
  'externalRules',
  'pluginRules',
  'internalRules',
  'contextRules',
  'internalCustomRules',
];
/**
 * A wrapper of ESLint linter
 *
 * The purpose of the wrapper is to configure the behaviour of ESLint linter,
 * which includes:
 *
 * - defining the rules that should be used during linting,
 * - declaring globals that need to be considered as such
 * - defining the environments bringing a set of predefined variables
 *
 * Because some rules target main files while other target test files (or even
 * both), the wrapper relies on two linting configurations to decide which set
 * of rules should be considered during linting.
 *
 * Last but not least, the linter wrapper eventually turns ESLint problems,
 * also known as messages, into SonarQube issues.
 */
var LinterWrapper = /** @class */ (function () {
  /**
   * Constructs an ESLint linter wrapper
   *
   * Constructing a linter wrapper consists in building the rule database
   * the internal ESLint linter shall consider during linting. Furthermore,
   * it creates a linting configuration that configures which rules should
   * be used on linting based on the active quality profile and file type.
   *
   * The order of defining rules is important here because internal rules
   * and external ones might share the same name by accident, which would
   * unexpectedly overwrite the behaviour of the internal one in favor of
   * the external one. This is why some internal rules are named with the
   * prefix `sonar-`, e.g., `sonar-no-fallthrough`.
   *
   * @param options the wrapper's options
   */
  function LinterWrapper(options) {
    if (options === void 0) {
      options = {};
    }
    var _a;
    this.options = options;
    this.configurationKeys = [];
    this.linter = new eslint_1.Linter();
    (0, bundle_loader_1.loadBundles)(
      this.linter,
      (_a = options.ruleBundles) !== null && _a !== void 0 ? _a : defaultRuleBundles,
    );
    (0, bundle_loader_1.loadCustomRules)(this.linter, options.customRules);
    this.config = this.createConfig();
  }
  LinterWrapper.prototype.linterConfigurationKey = function (key) {
    var r = this.configurationKeys.find(function (v) {
      return v.language === key.language && v.fileType === key.fileType;
    });
    if (r) {
      return r;
    } else {
      this.configurationKeys.push(key);
      return key;
    }
  };
  /**
   * Lints an ESLint source code instance
   *
   * Linting a source code implies using ESLint linting functionality to find
   * problems in the code. It selects which linting configuration needs to be
   * considered during linting based on the file type.
   *
   * @param sourceCode the ESLint source code
   * @param filePath the path of the source file
   * @param fileType the type of the source file
   * @param language language of the source file
   * @returns the linting result
   */
  LinterWrapper.prototype.lint = function (sourceCode, filePath, fileType, language) {
    if (fileType === void 0) {
      fileType = 'MAIN';
    }
    if (language === void 0) {
      language = 'js';
    }
    var key = { fileType: fileType, language: language };
    (0, src_1.debug)('Using linter configuration for '.concat(JSON.stringify(key)));
    var linterConfig = this.getConfig(key);
    if (!linterConfig) {
      // we create default linter config with internal rules only which provide metrics, tokens, etc...
      linterConfig = (0, config_1.createLinterConfig)(
        [],
        this.linter.getRules(),
        this.options.environments,
        this.options.globals,
      );
      this.config.set(key, linterConfig);
    }
    var config = __assign(__assign({}, linterConfig), {
      settings: __assign(__assign({}, linterConfig.settings), { fileType: fileType }),
    });
    var options = { filename: filePath, allowInlineConfig: false };
    var messages = this.linter.verify(sourceCode, config, options);
    return (0, issues_1.transformMessages)(messages, {
      sourceCode: sourceCode,
      rules: this.linter.getRules(),
    });
  };
  /**
   * Creates the wrapper's linting configuration
   *
   * The wrapper's linting configuration actually includes two
   * ESLint configurations: one per file type.
   *
   * @returns the wrapper's linting configuration
   */
  LinterWrapper.prototype.createConfig = function () {
    var _this = this;
    var _a;
    (0, src_1.debug)('Creating linter config');
    var rulesByKey = new Map();
    (_a = this.options.inputRules) === null || _a === void 0
      ? void 0
      : _a.forEach(function (r) {
          var target = Array.isArray(r.fileTypeTarget) ? r.fileTypeTarget : [r.fileTypeTarget];
          target.forEach(function (fileType) {
            var _a, _b;
            var key = _this.linterConfigurationKey({
              language: (_a = r.language) !== null && _a !== void 0 ? _a : 'js',
              fileType: fileType,
            });
            var rules = (_b = rulesByKey.get(key)) !== null && _b !== void 0 ? _b : [];
            rules.push(r);
            rulesByKey.set(key, rules);
          });
        });
    rulesByKey.forEach(function (rules, key) {
      (0, src_1.debug)(
        'Linter config: '.concat(JSON.stringify(key), ' with ').concat(
          rules
            .map(function (r) {
              return r.key;
            })
            .sort(function (a, b) {
              return a.localeCompare(b);
            }),
        ),
      );
    });
    var configByKey = new Map();
    var linterRules = this.linter.getRules();
    rulesByKey.forEach(function (rules, key) {
      configByKey.set(
        key,
        (0, config_1.createLinterConfig)(
          rules,
          linterRules,
          _this.options.environments,
          _this.options.globals,
        ),
      );
    });
    return configByKey;
  };
  LinterWrapper.prototype.getConfig = function (key) {
    var k = this.linterConfigurationKey(key);
    return this.config.get(k);
  };
  return LinterWrapper;
})();
exports.LinterWrapper = LinterWrapper;
