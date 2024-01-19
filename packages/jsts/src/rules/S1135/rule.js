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
// https://sonarsource.github.io/rspec/#/rspec/S1135/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.reportPatternInComment = exports.rule = void 0;
var todoPattern = 'todo';
var letterPattern = /[\p{Letter}]/u;
exports.rule = {
  meta: {
    messages: {
      completeTODO: 'Complete the task associated to this "TODO" comment.',
    },
  },
  create: function (context) {
    return {
      'Program:exit': function () {
        reportPatternInComment(context, todoPattern, 'completeTODO');
      },
    };
  },
};
function reportPatternInComment(context, pattern, messageId) {
  var sourceCode = context.sourceCode;
  sourceCode.getAllComments().forEach(function (comment) {
    var rawText = comment.value.toLowerCase();
    if (rawText.includes(pattern)) {
      var lines = rawText.split(/\r\n?|\n/);
      for (var i = 0; i < lines.length; i++) {
        var index = lines[i].indexOf(pattern);
        if (index >= 0 && !isLetterAround(lines[i], index, pattern)) {
          context.report({
            messageId: messageId,
            loc: getPatternPosition(i, index, comment, pattern),
          });
        }
      }
    }
  });
}
exports.reportPatternInComment = reportPatternInComment;
function isLetterAround(line, start, pattern) {
  var end = start + pattern.length;
  var pre = start > 0 && letterPattern.test(line.charAt(start - 1));
  var post = end <= line.length - 1 && letterPattern.test(line.charAt(end));
  return pre || post;
}
function getPatternPosition(lineIdx, index, comment, pattern) {
  var line = comment.loc.start.line + lineIdx;
  var columnStart = lineIdx === 0 ? comment.loc.start.column + 2 : 0;
  var patternStart = columnStart + index;
  return {
    start: { line: line, column: patternStart },
    end: { line: line, column: patternStart + pattern.length },
  };
}
