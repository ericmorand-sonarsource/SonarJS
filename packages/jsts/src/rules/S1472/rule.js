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
// https://sonarsource.github.io/rspec/#/rspec/S1472/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
exports.rule = {
  meta: {
    messages: {
      moveArguments: 'Make those call arguments start on line {{line}}.',
      moveTemplateLiteral: 'Make this template literal start on line {{line}}.',
    },
  },
  create: function (context) {
    var sourceCode = context.sourceCode;
    return {
      CallExpression: function (node) {
        var call = node;
        if (call.callee.type !== 'CallExpression' && call.arguments.length === 1) {
          var callee = getCallee(call);
          var parenthesis = sourceCode.getLastTokenBetween(
            callee,
            call.arguments[0],
            isClosingParen,
          );
          var calleeLastLine = (
            parenthesis !== null && parenthesis !== void 0
              ? parenthesis
              : sourceCode.getLastToken(callee)
          ).loc.end.line;
          var start = sourceCode.getTokenAfter(callee, isNotClosingParen).loc.start;
          if (calleeLastLine !== start.line) {
            var end = sourceCode.getLastToken(call).loc.end;
            if (end.line !== start.line) {
              //If arguments span multiple lines, we only report the first one
              reportIssue('moveArguments', start, calleeLastLine, context);
            } else {
              reportIssue('moveArguments', { start: start, end: end }, calleeLastLine, context);
            }
          }
        }
      },
      TaggedTemplateExpression: function (node) {
        var quasi = node.quasi;
        var tokenBefore = sourceCode.getTokenBefore(quasi);
        if (tokenBefore && quasi.loc && tokenBefore.loc.end.line !== quasi.loc.start.line) {
          var loc = {
            start: quasi.loc.start,
            end: {
              line: quasi.loc.start.line,
              column: quasi.loc.start.column + 1,
            },
          };
          reportIssue('moveTemplateLiteral', loc, tokenBefore.loc.start.line, context);
        }
      },
    };
  },
};
function getCallee(call) {
  var _a;
  var node = call;
  return (_a = node.typeParameters) !== null && _a !== void 0 ? _a : node.callee;
}
function isClosingParen(token) {
  return token.type === 'Punctuator' && token.value === ')';
}
function isNotClosingParen(token) {
  return !isClosingParen(token);
}
function reportIssue(messageId, loc, line, context) {
  context.report({
    messageId: messageId,
    data: {
      line: line.toString(),
    },
    loc: loc,
  });
}
