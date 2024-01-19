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
// https://sonarsource.github.io/rspec/#/rspec/S1523/javascript
// SQ key 'eval'
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
exports.rule = void 0;
var core_1 = require('../core');
var noScriptUrlRule = core_1.eslintRules['no-script-url'];
exports.rule = {
  meta: {
    messages: {
      safeCode: 'Make sure that this dynamic injection or execution of code is safe.',
      unexpectedScriptURL: "Make sure that 'javascript:' code is safe as it is a form of eval().",
    },
  },
  create: function (context) {
    return __assign(
      {
        CallExpression: function (node) {
          return checkCallExpression(node, context);
        },
        NewExpression: function (node) {
          return checkCallExpression(node, context);
        },
      },
      noScriptUrlRule.create(context),
    );
  },
};
function checkCallExpression(node, context) {
  if (node.callee.type === 'Identifier') {
    var name_1 = node.callee.name;
    if (
      (name_1 === 'eval' || name_1 === 'Function') &&
      hasAtLeastOneVariableArgument(node.arguments)
    ) {
      context.report({
        messageId: 'safeCode',
        node: node.callee,
      });
    }
  }
}
function hasAtLeastOneVariableArgument(args) {
  return !!args.find(function (arg) {
    return !isLiteral(arg);
  });
}
function isLiteral(node) {
  if (node.type === 'Literal') {
    return true;
  }
  if (node.type === 'TemplateLiteral') {
    return node.expressions.length === 0;
  }
  return false;
}
