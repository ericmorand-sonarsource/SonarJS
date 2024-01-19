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
// https://sonarsource.github.io/rspec/#/rspec/S2077/javascript
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
exports.rule = void 0;
var helpers_1 = require('../helpers');
var dbModules = ['pg', 'mysql', 'mysql2', 'sequelize'];
exports.rule = {
  meta: {
    messages: {
      safeQuery: 'Make sure that executing SQL queries is safe here.',
    },
  },
  create: function (context) {
    var isDbModuleImported = false;
    return {
      Program: function () {
        // init flag for each file
        isDbModuleImported = false;
      },
      ImportDeclaration: function (node) {
        var source = node.source;
        if (dbModules.includes(String(source.value))) {
          isDbModuleImported = true;
        }
      },
      CallExpression: function (node) {
        var call = node;
        var callee = call.callee,
          args = call.arguments;
        if (helpers_1.isRequireModule.apply(void 0, __spreadArray([call], dbModules, false))) {
          isDbModuleImported = true;
          return;
        }
        if (
          isDbModuleImported &&
          (0, helpers_1.isMemberWithProperty)(callee, 'query') &&
          isQuestionable(args[0])
        ) {
          context.report({
            messageId: 'safeQuery',
            node: callee,
          });
        }
      },
    };
  },
};
function isQuestionable(sqlQuery) {
  if (!sqlQuery) {
    return false;
  }
  if (isTemplateWithVar(sqlQuery)) {
    return true;
  }
  if (isConcatenation(sqlQuery)) {
    return isVariableConcat(sqlQuery);
  }
  return (
    sqlQuery.type === 'CallExpression' &&
    (0, helpers_1.isMemberWithProperty)(sqlQuery.callee, 'concat', 'replace')
  );
}
function isVariableConcat(node) {
  var left = node.left,
    right = node.right;
  if (!isHardcodedLiteral(right)) {
    return true;
  }
  if (isConcatenation(left)) {
    return isVariableConcat(left);
  }
  return !isHardcodedLiteral(left);
}
function isTemplateWithVar(node) {
  return node.type === 'TemplateLiteral' && node.expressions.length !== 0;
}
function isTemplateWithoutVar(node) {
  return node.type === 'TemplateLiteral' && node.expressions.length === 0;
}
function isConcatenation(node) {
  return node.type === 'BinaryExpression' && node.operator === '+';
}
function isHardcodedLiteral(node) {
  return node.type === 'Literal' || isTemplateWithoutVar(node);
}
