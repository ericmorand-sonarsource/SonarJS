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
// https://sonarsource.github.io/rspec/#/rspec/S1451/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var cached;
exports.rule = {
  meta: {
    messages: {
      fixHeader: 'Add or update the header of this file.',
    },
  },
  create: function (context) {
    updateCache(context.options);
    if (cached.failedToCompile) {
      // don't visit anything
      return {};
    }
    return {
      'Program:exit': function () {
        if (cached.isRegularExpression) {
          checkRegularExpression(cached.searchPattern, context);
        } else {
          checkPlainText(cached.expectedLines, context);
        }
      },
    };
  },
};
function checkPlainText(expectedLines, context) {
  var matches = false;
  var lines = context.sourceCode.lines;
  if (expectedLines.length <= lines.length) {
    matches = true;
    var i = 0;
    for (var _i = 0, expectedLines_1 = expectedLines; _i < expectedLines_1.length; _i++) {
      var expectedLine = expectedLines_1[_i];
      var line = lines[i];
      i++;
      if (line !== expectedLine) {
        matches = false;
        break;
      }
    }
  }
  if (!matches) {
    addFileIssue(context);
  }
}
function checkRegularExpression(searchPattern, context) {
  var fileContent = context.sourceCode.getText();
  var match = searchPattern.exec(fileContent);
  if (!match || match.index !== 0) {
    addFileIssue(context);
  }
}
function addFileIssue(context) {
  context.report({
    messageId: 'fixHeader',
    loc: { line: 0, column: 0 },
  });
}
function updateCache(options) {
  var _a = options[0],
    headerFormat = _a.headerFormat,
    isRegularExpression = _a.isRegularExpression;
  if (
    !cached ||
    cached.headerFormat !== headerFormat ||
    cached.isRegularExpression !== isRegularExpression
  ) {
    cached = {
      headerFormat: headerFormat,
      isRegularExpression: isRegularExpression,
    };
    if (isRegularExpression) {
      try {
        cached.searchPattern = new RegExp(headerFormat, 's');
        cached.failedToCompile = false;
      } catch (e) {
        console.error(
          'Failed to compile regular expression for rule S1451 ('.concat(e.message, ')'),
        );
        cached.failedToCompile = true;
      }
    } else {
      cached.expectedLines = headerFormat.split(/(?:\r)?\n|\r/);
    }
  }
}
