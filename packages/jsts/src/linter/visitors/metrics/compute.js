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
exports.computeMetrics = void 0;
var classes_1 = require('./classes');
var comments_1 = require('./comments');
var cyclomatic_complexity_1 = require('./cyclomatic-complexity');
var executable_lines_1 = require('./executable-lines');
var functions_1 = require('./functions');
var ncloc_1 = require('./ncloc');
var statements_1 = require('./statements');
/**
 * Computes the metrics of an ESLint source code
 * @param sourceCode the ESLint source code
 * @param ignoreHeaderComments a flag to ignore file header comments
 * @param cognitiveComplexity the cognitive complexity of the source code
 * @returns the source code metrics
 */
function computeMetrics(sourceCode, ignoreHeaderComments, cognitiveComplexity) {
  if (cognitiveComplexity === void 0) {
    cognitiveComplexity = 0;
  }
  return __assign(
    __assign(
      { ncloc: (0, ncloc_1.findNcloc)(sourceCode) },
      (0, comments_1.findCommentLines)(sourceCode, ignoreHeaderComments),
    ),
    {
      executableLines: (0, executable_lines_1.findExecutableLines)(sourceCode),
      functions: (0, functions_1.countFunctions)(sourceCode),
      statements: (0, statements_1.countStatements)(sourceCode),
      classes: (0, classes_1.countClasses)(sourceCode),
      complexity: (0, cyclomatic_complexity_1.computeCyclomaticComplexity)(sourceCode),
      cognitiveComplexity: cognitiveComplexity,
    },
  );
}
exports.computeMetrics = computeMetrics;
