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
exports.analyzeJSTS = void 0;
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
var src_1 = require('../../../shared/src');
var linter_1 = require('../linter');
var builders_1 = require('../builders');
var monitoring_1 = require('../monitoring');
/**
 * Analyzes a JavaScript / TypeScript analysis input
 *
 * Analyzing a JavaScript / TypeScript analysis input implies building
 * an ESLint SourceCode instance, meaning parsing the actual code to get
 * an abstract syntax tree to operate on. Any parsing error is returned
 * immediately. Otherwise, the analysis proceeds with the actual linting
 * of the source code. The linting result is returned along with some
 * analysis performance data.
 *
 * The analysis requires that global linter wrapper is initialized.
 *
 * @param input the JavaScript / TypeScript analysis input to analyze
 * @param language the language of the analysis input
 * @returns the JavaScript / TypeScript analysis output
 */
function analyzeJSTS(input, language) {
  (0, src_1.debug)(
    'Analyzing file "'.concat(input.filePath, '" with linterId "').concat(input.linterId, '"'),
  );
  var linter = (0, linter_1.getLinter)(input.linterId);
  var building = function () {
    return (0, builders_1.buildSourceCode)(input, language);
  };
  var _a = (0, monitoring_1.measureDuration)(building),
    built = _a.result,
    parseTime = _a.duration;
  var analysis = function () {
    return analyzeFile(linter, input, built);
  };
  var _b = (0, monitoring_1.measureDuration)(analysis),
    output = _b.result,
    analysisTime = _b.duration;
  return __assign(__assign({}, output), {
    perf: { parseTime: parseTime, analysisTime: analysisTime },
  });
}
exports.analyzeJSTS = analyzeJSTS;
/**
 * Analyzes a parsed ESLint SourceCode instance
 *
 * Analyzing a parsed ESLint SourceCode instance consists in linting the source code
 * and computing extended metrics about the code. At this point, the linting results
 * are already SonarQube-compatible and can be consumed back as such by the sensor.
 *
 * @param linter the linter to use for the analysis
 * @param input the JavaScript / TypeScript analysis input to analyze
 * @param sourceCode the corresponding parsed ESLint SourceCode instance
 * @returns the JavaScript / TypeScript analysis output
 */
function analyzeFile(linter, input, sourceCode) {
  try {
    var filePath = input.filePath,
      fileType = input.fileType,
      language = input.language;
    var _a = linter.lint(sourceCode, filePath, fileType, language),
      issues = _a.issues,
      highlightedSymbols = _a.highlightedSymbols,
      cognitiveComplexity = _a.cognitiveComplexity,
      ucfgPaths = _a.ucfgPaths;
    var extendedMetrics = computeExtendedMetrics(
      input,
      sourceCode,
      highlightedSymbols,
      cognitiveComplexity,
    );
    return __assign({ issues: issues, ucfgPaths: ucfgPaths }, extendedMetrics);
  } catch (e) {
    /** Turns exceptions from TypeScript compiler into "parsing" errors */
    if (e.stack.indexOf('typescript.js:') > -1) {
      throw src_1.APIError.failingTypeScriptError(e.message);
    } else {
      throw e;
    }
  }
}
/**
 * Computes extended metrics about the analyzed code
 *
 * Computed extended metrics may differ depending on the analysis context:
 *
 * - SonarLint doesn't care about code metrics except for `NOSONAR` comments
 * - All kinds of metrics are considered for main files.
 * - Symbol highlighting, syntax highlighting and `NOSONAR` comments are only consider
 *   for test files.
 *
 * @param input the JavaScript / TypeScript analysis input to analyze
 * @param sourceCode the analyzed ESLint SourceCode instance
 * @param highlightedSymbols the computed symbol highlighting of the code
 * @param cognitiveComplexity the computed cognitive complexity of the code
 * @returns the extended metrics of the code
 */
function computeExtendedMetrics(input, sourceCode, highlightedSymbols, cognitiveComplexity) {
  if ((0, src_1.getContext)().sonarlint) {
    return { metrics: (0, linter_1.findNoSonarLines)(sourceCode) };
  }
  var fileType = input.fileType,
    ignoreHeaderComments = input.ignoreHeaderComments;
  if (fileType === 'MAIN') {
    return {
      highlightedSymbols: highlightedSymbols,
      highlights: (0, linter_1.getSyntaxHighlighting)(sourceCode).highlights,
      metrics: (0, linter_1.computeMetrics)(
        sourceCode,
        !!ignoreHeaderComments,
        cognitiveComplexity,
      ),
      cpdTokens: (0, linter_1.getCpdTokens)(sourceCode).cpdTokens,
    };
  } else {
    return {
      highlightedSymbols: highlightedSymbols,
      highlights: (0, linter_1.getSyntaxHighlighting)(sourceCode).highlights,
      metrics: (0, linter_1.findNoSonarLines)(sourceCode),
    };
  }
}
