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
// https://sonarsource.github.io/rspec/#/rspec/S3524/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var MESSAGE_ADD_PARAMETER = 'Add parentheses around the parameter of this arrow function.';
var MESSAGE_REMOVE_PARAMETER = 'Remove parentheses around the parameter of this arrow function.';
var MESSAGE_ADD_BODY = 'Add curly braces and "return" to this arrow function body.';
var MESSAGE_REMOVE_BODY = 'Remove curly braces and "return" from this arrow function body.';
exports.rule = {
  meta: {
    schema: [
      {
        type: 'object',
        properties: {
          requireParameterParentheses: {
            type: 'boolean',
          },
          requireBodyBraces: {
            type: 'boolean',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create: function (context) {
    var options = context.options[0] || {};
    var requireParameterParentheses = !!options.requireParameterParentheses;
    var requireBodyBraces = !!options.requireBodyBraces;
    return {
      ArrowFunctionExpression: function (node) {
        var arrowFunction = node;
        checkParameters(context, requireParameterParentheses, arrowFunction);
        checkBody(context, requireBodyBraces, arrowFunction);
      },
    };
  },
};
function checkParameters(context, requireParameterParentheses, arrowFunction) {
  if (arrowFunction.params.length !== 1) {
    return;
  }
  var parameter = arrowFunction.params[0];
  // Looking at the closing parenthesis after the parameter to avoid problems with cases like
  // `functionTakingCallbacks(x => {...})` where the opening parenthesis before `x` isn't part
  // of the function literal
  var tokenAfterParameter = context.sourceCode.getTokenAfter(parameter);
  var hasParameterParentheses = tokenAfterParameter && tokenAfterParameter.value === ')';
  if (requireParameterParentheses && !hasParameterParentheses) {
    context.report({ node: parameter, message: MESSAGE_ADD_PARAMETER });
  } else if (
    !requireParameterParentheses &&
    !hasGeneric(context, arrowFunction) &&
    hasParameterParentheses
  ) {
    var arrowFunctionComments = context.sourceCode.getCommentsInside(arrowFunction);
    var arrowFunctionBodyComments_1 = context.sourceCode.getCommentsInside(arrowFunction.body);
    // parameters comments inside parentheses are not available, so use the following subtraction:
    var hasArrowFunctionParamsComments =
      arrowFunctionComments.filter(function (comment) {
        return !arrowFunctionBodyComments_1.includes(comment);
      }).length > 0;
    if (
      parameter.type === 'Identifier' &&
      !hasArrowFunctionParamsComments &&
      !parameter.typeAnnotation &&
      !arrowFunction.returnType
    ) {
      context.report({ node: parameter, message: MESSAGE_REMOVE_PARAMETER });
    }
  }
}
function hasGeneric(context, arrowFunction) {
  var offset = arrowFunction.async ? 1 : 0;
  var firstTokenIgnoreAsync = context.sourceCode.getFirstToken(arrowFunction, offset);
  return firstTokenIgnoreAsync && firstTokenIgnoreAsync.value === '<';
}
function checkBody(context, requireBodyBraces, arrowFunction) {
  var hasBodyBraces = arrowFunction.body.type === 'BlockStatement';
  if (requireBodyBraces && !hasBodyBraces) {
    context.report({ node: arrowFunction.body, message: MESSAGE_ADD_BODY });
  } else if (!requireBodyBraces && hasBodyBraces) {
    var statements = arrowFunction.body.body;
    if (statements.length === 1) {
      var statement = statements[0];
      if (isRemovableReturn(statement)) {
        context.report({ node: arrowFunction.body, message: MESSAGE_REMOVE_BODY });
      }
    }
  }
}
function isRemovableReturn(statement) {
  if (statement.type === 'ReturnStatement') {
    var returnStatement = statement;
    var returnExpression = returnStatement.argument;
    if (returnExpression && returnExpression.type !== 'ObjectExpression') {
      var location_1 = returnExpression.loc;
      return location_1 && location_1.start.line === location_1.end.line;
    }
  }
  return false;
}
