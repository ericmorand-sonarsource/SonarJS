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
exports.analyzeEmbedded = void 0;
var linter_1 = require('../../linter');
var builder_1 = require('../builder');
var src_1 = require('../../../../shared/src');
var monitoring_1 = require('../../monitoring');
var ncloc_1 = require('../../linter/visitors/metrics/ncloc');
/**
 * Analyzes a file containing JS snippets
 *
 * Analyzing embedded JS is part of analyzing inline JavaScript code
 * within various file formats: YAML, HTML, etc. The function first starts by parsing
 * the whole file to validate its syntax and to get in return an abstract syntax
 * tree. This abstract syntax tree is then used to extract embedded JavaScript
 * code. As files might embed several JavaScript snippets, the function
 * builds an ESLint SourceCode instance for each snippet using the same utility
 * as for building source code for regular JavaScript analysis inputs. However,
 * since a file can potentially produce multiple ESLint SourceCode instances,
 * the function stops to the first JavaScript parsing error and returns it without
 * considering any other. If all abstract syntax trees are valid, the function
 * then proceeds with linting each of them, aggregates, and returns the results.
 *
 * The analysis requires that global linter wrapper is initialized.
 *
 * @param input the analysis input
 * @param languageParser the parser for the language of the file containing the JS code
 * @returns the analysis output
 */
function analyzeEmbedded(input, languageParser) {
  (0, src_1.debug)(
    'Analyzing file "'.concat(input.filePath, '" with linterId "').concat(input.linterId, '"'),
  );
  var linter = (0, linter_1.getLinter)(input.linterId);
  var building = function () {
    return (0, builder_1.buildSourceCodes)(input, languageParser);
  };
  var _a = (0, monitoring_1.measureDuration)(building),
    extendedSourceCodes = _a.result,
    parseTime = _a.duration;
  var analysis = function () {
    return analyzeFile(linter, extendedSourceCodes);
  };
  var _b = (0, monitoring_1.measureDuration)(analysis),
    output = _b.result,
    analysisTime = _b.duration;
  return __assign(__assign({}, output), {
    perf: { parseTime: parseTime, analysisTime: analysisTime },
  });
}
exports.analyzeEmbedded = analyzeEmbedded;
/**
 * Extracted logic from analyzeEmbedded() so we can compute metrics
 *
 * @param linter
 * @param extendedSourceCodes
 * @returns
 */
function analyzeFile(linter, extendedSourceCodes) {
  var aggregatedIssues = [];
  var aggregatedUcfgPaths = [];
  var ncloc = [];
  for (
    var _i = 0, extendedSourceCodes_1 = extendedSourceCodes;
    _i < extendedSourceCodes_1.length;
    _i++
  ) {
    var extendedSourceCode = extendedSourceCodes_1[_i];
    var _a = analyzeSnippet(linter, extendedSourceCode),
      issues = _a.issues,
      ucfgPaths = _a.ucfgPaths,
      singleNcLoc = _a.ncloc;
    ncloc = ncloc.concat(singleNcLoc);
    var filteredIssues = removeNonJsIssues(extendedSourceCode, issues);
    aggregatedIssues.push.apply(aggregatedIssues, filteredIssues);
    aggregatedUcfgPaths.push.apply(aggregatedUcfgPaths, ucfgPaths);
  }
  return {
    issues: aggregatedIssues,
    ucfgPaths: aggregatedUcfgPaths,
    metrics: { ncloc: ncloc },
  };
  function analyzeSnippet(linter, extendedSourceCode) {
    var _a = linter.lint(extendedSourceCode, extendedSourceCode.syntheticFilePath, 'MAIN'),
      issues = _a.issues,
      ucfgPaths = _a.ucfgPaths;
    var ncloc = (0, ncloc_1.findNcloc)(extendedSourceCode);
    return { issues: issues, ucfgPaths: ucfgPaths, ncloc: ncloc };
  }
  /**
   * Filters out issues outside of JS code.
   *
   * This is necessary because we patch the SourceCode object
   * to include the whole file in its properties outside its AST.
   * So rules that operate on SourceCode.text get flagged.
   */
  function removeNonJsIssues(sourceCode, issues) {
    var _a = sourceCode.ast.range.map(function (offset) {
        return sourceCode.getLocFromIndex(offset);
      }),
      jsStart = _a[0],
      jsEnd = _a[1];
    return issues.filter(function (issue) {
      var issueStart = { line: issue.line, column: issue.column };
      return isBeforeOrEqual(jsStart, issueStart) && isBeforeOrEqual(issueStart, jsEnd);
    });
    function isBeforeOrEqual(a, b) {
      if (a.line < b.line) {
        return true;
      } else if (a.line > b.line) {
        return false;
      } else {
        return a.column <= b.column;
      }
    }
  }
}
