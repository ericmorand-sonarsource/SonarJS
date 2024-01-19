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
// Greatly inspired by https://github.com/eslint/eslint/blob/561b6d4726f3e77dd40ba0d340ca7f08429cd2eb/lib/rules/max-lines-per-function.js
// We had to fork the implementation to control the reporting (issue location), in order to provide a better user experience.
Object.defineProperty(exports, '__esModule', { value: true });
exports.getCommentLineNumbers = exports.getLocsNumber = exports.rule = void 0;
var locations_1 = require('eslint-plugin-sonarjs/lib/utils/locations');
var helpers_1 = require('../helpers');
exports.rule = {
  meta: {
    messages: {
      functionMaxLine:
        'This function has {{lineCount}} lines, which is greater than the {{threshold}} lines authorized. Split it into smaller functions.',
    },
    schema: [{ type: 'integer' }],
  },
  create: function (context) {
    var threshold = context.options[0];
    var sourceCode = context.sourceCode;
    var lines = sourceCode.lines;
    var commentLineNumbers = getCommentLineNumbers(sourceCode.getAllComments());
    var functionStack = [];
    var functionKnowledge = new Map();
    return {
      'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression': function (node) {
        functionStack.push(node);
        var parent = (0, helpers_1.getParent)(context);
        if (!node.loc || isIIFE(node, parent)) {
          return;
        }
        var lineCount = getLocsNumber(node.loc, lines, commentLineNumbers);
        var startsWithCapital = nameStartsWithCapital(node);
        functionKnowledge.set(node, {
          node: node,
          lineCount: lineCount,
          startsWithCapital: startsWithCapital,
          returnsJSX: false,
        });
      },
      ReturnStatement: function (node) {
        var returnStatement = node;
        var knowledge = functionKnowledge.get((0, helpers_1.last)(functionStack));
        if (
          knowledge &&
          returnStatement.argument &&
          returnStatement.argument.type.startsWith('JSX')
        ) {
          knowledge.returnsJSX = true;
        }
      },
      'FunctionDeclaration:exit': function () {
        functionStack.pop();
      },
      'FunctionExpression:exit': function () {
        functionStack.pop();
      },
      'ArrowFunctionExpression:exit': function () {
        functionStack.pop();
      },
      'Program:exit': function () {
        for (var _i = 0, _a = functionKnowledge.values(); _i < _a.length; _i++) {
          var knowledge = _a[_i];
          var node = knowledge.node,
            lineCount = knowledge.lineCount;
          if (lineCount > threshold && !isReactFunctionComponent(knowledge)) {
            var functionLike = node;
            context.report({
              messageId: 'functionMaxLine',
              data: {
                lineCount: lineCount.toString(),
                threshold: threshold,
              },
              loc: (0, locations_1.getMainFunctionTokenLocation)(
                functionLike,
                functionLike.parent,
                context,
              ),
            });
          }
        }
      },
    };
  },
};
function getLocsNumber(loc, lines, commentLineNumbers) {
  var lineCount = 0;
  for (var i = loc.start.line - 1; i < loc.end.line; ++i) {
    var line = lines[i];
    var comment = commentLineNumbers.get(i + 1);
    if (comment && isFullLineComment(line, i + 1, comment)) {
      continue;
    }
    if (line.match(/^\s*$/u)) {
      continue;
    }
    lineCount++;
  }
  return lineCount;
}
exports.getLocsNumber = getLocsNumber;
function getCommentLineNumbers(comments) {
  var map = new Map();
  comments.forEach(function (comment) {
    if (comment.loc) {
      for (var i = comment.loc.start.line; i <= comment.loc.end.line; i++) {
        map.set(i, comment);
      }
    }
  });
  return map;
}
exports.getCommentLineNumbers = getCommentLineNumbers;
function isFullLineComment(line, lineNumber, comment) {
  if (!comment.loc) {
    return false;
  }
  var _a = comment.loc,
    start = _a.start,
    end = _a.end;
  var isFirstTokenOnLine = start.line === lineNumber && !line.slice(0, start.column).trim();
  var isLastTokenOnLine = end.line === lineNumber && !line.slice(end.column).trim();
  return (
    comment &&
    (start.line < lineNumber || isFirstTokenOnLine) &&
    (end.line > lineNumber || isLastTokenOnLine)
  );
}
function isIIFE(node, parent) {
  return (
    node.type === 'FunctionExpression' &&
    parent &&
    parent.type === 'CallExpression' &&
    parent.callee === node
  );
}
function isReactFunctionComponent(knowledge) {
  return knowledge.startsWithCapital && knowledge.returnsJSX;
}
function nameStartsWithCapital(node) {
  var _a;
  var identifier =
    (_a = getIdentifierFromNormalFunction(node)) !== null && _a !== void 0
      ? _a
      : getIdentifierFromArrowFunction(node);
  if (!identifier) {
    return false;
  }
  return isIdentifierUppercase(identifier);
  /**
   * Picks `Foo` from: `let Foo = () => {}`
   */
  function getIdentifierFromArrowFunction(node) {
    if (node.type !== 'ArrowFunctionExpression') {
      return null;
    }
    var parent = (0, helpers_1.getNodeParent)(node);
    if (!parent) {
      return null;
    }
    if (parent.type === 'VariableDeclarator') {
      return parent.id;
    } else {
      return null;
    }
  }
  /**
   * Picks `Foo` from:
   * - `function Foo() {}`
   * - `let bar = function Foo() {}`
   */
  function getIdentifierFromNormalFunction(node) {
    if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
      return node.id;
    }
  }
  function isIdentifierUppercase(node) {
    return node.name.startsWith(node.name[0].toUpperCase());
  }
}
