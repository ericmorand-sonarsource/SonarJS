'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod)
        if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.parseForESLint = exports.check = void 0;
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
var fs = __importStar(require('fs'));
var path = __importStar(require('path'));
var eslint_1 = require('eslint');
var parameters_1 = require('../../../../src/linter/parameters');
var builders_1 = require('../../../../src/builders');
var framework_1 = require('./framework');
/**
 * Loading this file's `parseForESLint()` function into ESLint's rule tester.
 */
var ruleTester = new eslint_1.RuleTester({ parser: __filename });
/**
 * Checks that a rule raises the issues declared as comment-based expectations on fixture files.
 * These fixtures are to be found in the rule directory and should be named as `*.fixture.<ext>`.
 * The directory can include options (`cb.options.json`) to configure the rule behaviour.
 */
function check(ruleId, ruleModule, ruleDir) {
  var fixtures = [];
  for (var _i = 0, _a = fs.readdirSync(ruleDir, { recursive: true }); _i < _a.length; _i++) {
    var file = _a[_i];
    if (/\.fixture\.(js|ts|jsx|tsx|vue)$/.exec(file)) {
      var fixture = path.join(ruleDir, file);
      fixtures.push(fixture);
    }
  }
  for (var _b = 0, fixtures_1 = fixtures; _b < fixtures_1.length; _b++) {
    var fixture = fixtures_1[_b];
    var code = fs.readFileSync(fixture, { encoding: 'utf8' }).replace(/\r?\n|\r/g, '\n');
    var _c = (0, framework_1.extractExpectations)(
        code,
        fixture,
        (0, parameters_1.hasSonarRuntimeOption)(ruleModule, ruleId),
      ),
      errors = _c.errors,
      output = _c.output;
    var options = extractRuleOptions(ruleDir);
    var tests = {
      valid: [],
      invalid: [
        { code: code, filename: fixture, errors: errors, options: options, output: output },
      ],
    };
    ruleTester.run('Fixture '.concat(fixture), ruleModule, tests);
  }
}
exports.check = check;
/**
 * This function is provided as 'parseForESLint' implementation which is used in RuleTester to invoke exactly same logic
 * as we use in our 'services/analysis/analyzer.ts' module
 */
function parseForESLint(fileContent, options, fileType) {
  if (fileType === void 0) {
    fileType = 'MAIN';
  }
  var filePath = options.filePath;
  var tsConfigs = [path.join(__dirname, '../../../../src/rules', 'tsconfig.cb.json')];
  var sourceCode = (0, builders_1.buildSourceCode)(
    { filePath: filePath, fileContent: fileContent, fileType: fileType, tsConfigs: tsConfigs },
    languageFromFile(fileContent, filePath),
  );
  /**
   * ESLint expects the parser services (including the type checker) to be available in a field
   * `services` after parsing while TypeScript ESLint returns it as `parserServices`. Therefore,
   * we need to extend the source code with this additional property so that the type checker
   * can be retrieved from type-aware rules.
   */
  return Object.create(sourceCode, {
    services: { value: sourceCode.parserServices },
  });
}
exports.parseForESLint = parseForESLint;
function extractRuleOptions(ruleDir) {
  var options = path.join(ruleDir, 'cb.options.json');
  if (fs.existsSync(options)) {
    return JSON.parse(fs.readFileSync(options, { encoding: 'utf8' }));
  }
  return [];
}
/**
 * Returns the source code's language based on the file content and path.
 */
function languageFromFile(fileContent, filePath) {
  // Keep this regex aligned with the one in JavaScriptFilePredicate.java to have the same flow
  var hasScriptTagWithLangTs = /<script[^>]+lang=['"]ts['"][^>]*>/;
  var ext = path.parse(filePath).ext;
  if (
    ['.ts', '.tsx'].includes(ext) ||
    (ext === '.vue' && hasScriptTagWithLangTs.test(fileContent))
  ) {
    return 'ts';
  } else {
    return 'js';
  }
}
