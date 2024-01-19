'use strict';
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
/**
 * Comment-based Testing Framework
 *
 * This utility is a TypeScript implementation of the commented-based testing framework of `sonar-analyzer-commons`,
 * which is implemented in Java. It supports most of the documented features except for the `effortToFix` feature.
 *
 * Basically, this testing framework extracts convential comments from a source file that denote expected occurences
 * of issues at well-located lines with expected messages and secondary locations, if any.
 *
 * As such, this testing framework cannot be used to test actual rule implementatons, as it only provides a helper
 * function to extract issue expectations. To use it, please refer to `launcher.test.ts`.
 *
 * @see https://github.com/SonarSource/sonar-analyzer-commons/tree/master/test-commons
 * @see https://github.com/SonarSource/sonar-analyzer-commons/tree/master/test-commons#noncompliant-format
 */
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
exports.extractExpectations = void 0;
var helpers_1 = require('../../../../src/rules/helpers');
var helpers_2 = require('./helpers');
/**
 * Extracts issue expectations from a comment-based test file
 * @param fileContent the contents of the comment-based test file
 * @param filePath used to know if it's Vue or not
 * @param usesSecondaryLocations A flag that indicates if the tested rule uses sonar-runtime parameter
 * @returns an array of ESLint test case errors
 */
function extractExpectations(fileContent, filePath, usesSecondaryLocations) {
  var expectedIssues = new helpers_2.FileIssues(fileContent, filePath).getExpectedIssues();
  var encodeMessageIfNeeded = usesSecondaryLocations
    ? helpers_1.toEncodedMessage
    : function (message) {
        return message;
      };
  var result = { errors: [], output: fileContent };
  expectedIssues.forEach(function (issue) {
    var line = issue.line;
    var primary = issue.primaryLocation;
    var messages = __spreadArray([], issue.messages.values(), true);
    var quickfixes = issue.quickfixes ? __spreadArray([], issue.quickfixes.values(), true) : [];
    messages.forEach(function (message, index) {
      var suggestions = applyQuickFixes(
        quickfixes.filter(function (quickfix) {
          return quickfix.messageIndex === index;
        }),
        fileContent,
        result,
        expectedIssues,
      );
      var error = __assign(
        __assign({}, suggestions),
        (primary === null || primary === void 0 ? void 0 : primary.range) || { line: line },
      );
      if (primary !== null) {
        var secondary = primary.secondaryLocations;
        if (secondary.length) {
          error.message = encodeMessageIfNeeded(
            message,
            secondary.map(function (s) {
              return s.range.toLocationHolder();
            }),
            secondary.map(function (s) {
              return s.message;
            }),
          );
        }
      }
      if (!error.message && message) {
        error.message = encodeMessageIfNeeded(message);
      }
      result.errors.push(error);
    });
  });
  if (result.output === fileContent) {
    result.output = null;
  }
  return result;
}
exports.extractExpectations = extractExpectations;
/**
 * Applies quick fix operations to the source code line.
 *
 * @param quickfixes array of quick fixes to apply
 * @param fileContent the file contents
 * @param result The result object to have access to the output attribute
 * @param issues the array of issues, needed if a reindex needs to be done on all quickfixes
 */
function applyQuickFixes(quickfixes, fileContent, result, issues) {
  var suggestions = [];
  for (var _i = 0, quickfixes_1 = quickfixes; _i < quickfixes_1.length; _i++) {
    var quickfix = quickfixes_1[_i];
    var lines = (quickfix.mandatory ? result.output : fileContent).split(/\n/);
    var desc = quickfix.description,
      changes = quickfix.changes;
    for (var _a = 0, changes_1 = changes; _a < changes_1.length; _a++) {
      var change = changes_1[_a];
      switch (change.type) {
        case 'add':
          addLine(lines, change);
          if (quickfix.mandatory) {
            reIndexLines(issues, true, change.line);
          }
          break;
        case 'del':
          deleteLine(lines, change);
          if (quickfix.mandatory) {
            reIndexLines(issues, false, change.line);
          }
          break;
        case 'edit':
          editLine(lines, change);
      }
    }
    var output = lines.join('\n');
    if (output !== fileContent) {
      if (quickfix.mandatory) {
        result.output = output;
      } else {
        var suggestion = { output: output };
        if (desc) {
          suggestion.desc = desc;
        }
        suggestions.push(suggestion);
      }
    }
  }
  return suggestions.length ? { suggestions: suggestions } : {};
}
/**
 * After quickfixes add or delete a line, re-index the lines higher than
 * then given index, incrementing them by one when increment is true
 * or decrementing them otherwise
 * @param issues all issues from the file
 * @param increment where the lines need to be incremented or decremented
 * @param start starting line from which the change should be made
 */
function reIndexLines(issues, increment, start) {
  for (var _i = 0, issues_1 = issues; _i < issues_1.length; _i++) {
    var issue = issues_1[_i];
    for (var _a = 0, _b = issue.quickfixes; _a < _b.length; _a++) {
      var quickfix = _b[_a];
      if (quickfix.mandatory) {
        for (var _c = 0, _d = quickfix.changes; _c < _d.length; _c++) {
          var change = _d[_c];
          if (change.line > start) {
            increment ? change.line++ : change.line--;
          }
        }
      }
    }
  }
}
/**
 * Applies quick fix edits to a source code line. The fixed line will be formed by a
 * concatenation of three strings:
 *  - Original line from column 0 until start of fix column
 *  - Contents of fix
 *  - Original line from end of fix column until end of original line
 *
 * @param lines array of lines from file
 * @param change the change descriptor
 */
function editLine(lines, change) {
  var start = change.start,
    end = change.end,
    contents = change.contents,
    issueLine = change.line;
  if (contents !== undefined) {
    var appendAfterFix = '';
    var line = lines[issueLine - 1];
    var containsNC = line.search(/\s*\{?\s*(\/\*|\/\/)\s*Noncompliant/);
    if (end === undefined) {
      if (containsNC >= 0) {
        appendAfterFix = line.slice(containsNC);
      }
    } else {
      if (end < start) {
        throw new Error(
          'End column cannot be lower than start position '.concat(end, ' < ').concat(start),
        );
      }
      if (containsNC >= 0 && end > containsNC) {
        throw new Error(
          'End column cannot be in // Noncompliant comment '.concat(end, ' > ').concat(containsNC),
        );
      }
      appendAfterFix = line.slice(end);
    }
    lines[issueLine - 1] = line.slice(0, start || 0) + contents + appendAfterFix;
  }
}
/**
 * Adds a new line to the source code at the index and with the contents described
 * in the Change object
 *
 * @param lines array of lines from file
 * @param change the change descriptor
 */
function addLine(lines, change) {
  var contents = change.contents,
    line = change.line;
  if (contents !== undefined) {
    lines.splice(line - 1, 0, contents);
  }
}
/**
 * Removes the line from the source code.
 *
 * @param lines array of lines from file
 * @param change the change descriptor
 */
function deleteLine(lines, change) {
  lines.splice(change.line - 1, 1);
}
