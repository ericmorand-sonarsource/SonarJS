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
// https://sonarsource.github.io/rspec/#/rspec/S125/javascript
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
exports.rule = void 0;
var eslint_1 = require('eslint');
var babel = __importStar(require('@babel/eslint-parser'));
var parsers_1 = require('../../parsers');
var recognizers_1 = require('../../linter/recognizers');
var EXCLUDED_STATEMENTS = ['BreakStatement', 'LabeledStatement', 'ContinueStatement'];
var recognizer = new recognizers_1.CodeRecognizer(0.9, new recognizers_1.JavaScriptFootPrint());
exports.rule = {
  meta: {
    messages: {
      commentedCode: 'Remove this commented out code.',
      commentedCodeFix: 'Remove this commented out code',
    },
    hasSuggestions: true,
  },
  create: function (context) {
    function getGroupedComments(comments) {
      var groupedComments = [];
      var currentGroup = [];
      for (var _i = 0, comments_1 = comments; _i < comments_1.length; _i++) {
        var comment = comments_1[_i];
        if (comment.type === 'Block') {
          groupedComments.push({ value: comment.value, nodes: [comment] });
        } else if (
          currentGroup.length === 0 ||
          areAdjacentLineComments(currentGroup[currentGroup.length - 1], comment)
        ) {
          currentGroup.push(comment);
        } else {
          groupedComments.push({
            value: currentGroup
              .map(function (lineComment) {
                return lineComment.value;
              })
              .join('\n'),
            nodes: currentGroup,
          });
          currentGroup = [comment];
        }
      }
      if (currentGroup.length > 0) {
        groupedComments.push({
          value: currentGroup
            .map(function (lineComment) {
              return lineComment.value;
            })
            .join('\n'),
          nodes: currentGroup,
        });
      }
      return groupedComments;
    }
    function areAdjacentLineComments(previous, next) {
      var nextCommentLine = next.loc.start.line;
      if (previous.loc.start.line + 1 === nextCommentLine) {
        var nextCodeToken = context.sourceCode.getTokenAfter(previous);
        return !nextCodeToken || nextCodeToken.loc.start.line > nextCommentLine;
      }
      return false;
    }
    return {
      'Program:exit': function () {
        var groupedComments = getGroupedComments(context.sourceCode.getAllComments());
        groupedComments.forEach(function (groupComment) {
          var rawTextTrimmed = groupComment.value.trim();
          if (rawTextTrimmed !== '}' && containsCode(injectMissingBraces(rawTextTrimmed))) {
            context.report({
              messageId: 'commentedCode',
              loc: getCommentLocation(groupComment.nodes),
              suggest: [
                {
                  messageId: 'commentedCodeFix',
                  fix: function (fixer) {
                    var start = groupComment.nodes[0].range[0];
                    var end = groupComment.nodes[groupComment.nodes.length - 1].range[1];
                    return fixer.removeRange([start, end]);
                  },
                },
              ],
            });
          }
        });
      },
    };
  },
};
function isExpressionExclusion(statement, code) {
  if (statement.type === 'ExpressionStatement') {
    var expression = statement.expression;
    if (
      expression.type === 'Identifier' ||
      expression.type === 'SequenceExpression' ||
      isUnaryPlusOrMinus(expression) ||
      isExcludedLiteral(expression) ||
      !code.getLastToken(statement, function (token) {
        return token.value === ';';
      })
    ) {
      return true;
    }
  }
  return false;
}
function isExclusion(parsedBody, code) {
  if (parsedBody.length === 1) {
    var singleStatement = parsedBody[0];
    return (
      EXCLUDED_STATEMENTS.includes(singleStatement.type) ||
      isReturnThrowExclusion(singleStatement) ||
      isExpressionExclusion(singleStatement, code)
    );
  }
  return false;
}
function containsCode(value) {
  if (!couldBeJsCode(value)) {
    return false;
  }
  try {
    var options = (0, parsers_1.buildParserOptions)(
      { filePath: 'some/filePath', tsConfigs: [], fileContent: '', fileType: 'MAIN' },
      true,
    );
    var result = babel.parse(value, options);
    var parseResult = new eslint_1.SourceCode(value, result);
    return parseResult.ast.body.length > 0 && !isExclusion(parseResult.ast.body, parseResult);
  } catch (exception) {
    return false;
  }
  function couldBeJsCode(input) {
    return recognizer.extractCodeLines(input.split('\n')).length > 0;
  }
}
function injectMissingBraces(value) {
  var _a, _b;
  var openCurlyBraceNum = ((_a = value.match(/{/g)) !== null && _a !== void 0 ? _a : []).length;
  var closeCurlyBraceNum = ((_b = value.match(/}/g)) !== null && _b !== void 0 ? _b : []).length;
  var missingBraces = openCurlyBraceNum - closeCurlyBraceNum;
  if (missingBraces > 0) {
    return value + Array(missingBraces).fill('}').join('');
  } else if (missingBraces < 0) {
    return Array(-missingBraces).fill('{').join('') + value;
  } else {
    return value;
  }
}
function getCommentLocation(nodes) {
  return {
    start: nodes[0].loc.start,
    end: nodes[nodes.length - 1].loc.end,
  };
}
function isReturnThrowExclusion(statement) {
  if (statement.type === 'ReturnStatement' || statement.type === 'ThrowStatement') {
    return statement.argument == null || statement.argument.type === 'Identifier';
  }
  return false;
}
function isUnaryPlusOrMinus(expression) {
  return (
    expression.type === 'UnaryExpression' &&
    (expression.operator === '+' || expression.operator === '-')
  );
}
function isExcludedLiteral(expression) {
  if (expression.type === 'Literal') {
    return typeof expression.value === 'string' || typeof expression.value === 'number';
  }
  return false;
}
