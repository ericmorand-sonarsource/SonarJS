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
// https://sonarsource.github.io/rspec/#/rspec/S4634/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
exports.rule = {
  meta: {
    hasSuggestions: true,
    messages: {
      promiseAction: 'Replace this trivial promise with "Promise.{{action}}".',
      suggestPromiseAction: 'Replace with "Promise.{{action}}"',
    },
  },
  create: function (context) {
    return {
      NewExpression: function (node) {
        var newExpr = node;
        var executor = getPromiseExecutor(newExpr, context);
        if (executor) {
          checkExecutor(newExpr, executor, context);
        }
      },
    };
  },
};
function getPromiseExecutor(node, context) {
  if (
    node.callee.type === 'Identifier' &&
    context.sourceCode.getText(node.callee) === 'Promise' &&
    node.arguments.length === 1
  ) {
    return node.arguments[0];
  }
  return undefined;
}
function checkExecutor(newExpr, executor, context) {
  if (!(0, helpers_1.isFunctionNode)(executor)) {
    return;
  }
  var params = executor.params,
    body = executor.body;
  var resolveParameterDeclaration = params[0],
    rejectParameterDeclaration = params[1];
  var resolveParameterName = getParameterName(resolveParameterDeclaration);
  var rejectParameterName = getParameterName(rejectParameterDeclaration);
  var bodyExpression = getOnlyBodyExpression(body);
  if (bodyExpression && bodyExpression.type === 'CallExpression') {
    var callee = bodyExpression.callee,
      args_1 = bodyExpression.arguments;
    if (callee.type === 'Identifier') {
      var action_1 = getPromiseAction(callee.name, resolveParameterName, rejectParameterName);
      if (action_1 && args_1.length === 1) {
        context.report({
          messageId: 'promiseAction',
          data: {
            action: action_1,
          },
          node: newExpr.callee,
          suggest: [
            {
              messageId: 'suggestPromiseAction',
              data: {
                action: action_1,
              },
              fix: function (fixer) {
                var argText = context.sourceCode.getText(args_1[0]);
                return fixer.replaceText(
                  newExpr,
                  'Promise.'.concat(action_1, '(').concat(argText, ')'),
                );
              },
            },
          ],
        });
      }
    }
  }
}
function getOnlyBodyExpression(node) {
  var bodyExpression;
  if (node.type === 'BlockStatement') {
    if (node.body.length === 1) {
      var statement = node.body[0];
      if (statement.type === 'ExpressionStatement') {
        bodyExpression = statement.expression;
      }
    }
  } else {
    bodyExpression = node;
  }
  return bodyExpression;
}
function getPromiseAction(callee, resolveParameterName, rejectParameterName) {
  switch (callee) {
    case resolveParameterName:
      return 'resolve';
    case rejectParameterName:
      return 'reject';
    default:
      return undefined;
  }
}
function getParameterName(node) {
  return node && node.type === 'Identifier' ? node.name : undefined;
}
