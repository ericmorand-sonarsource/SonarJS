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
// https://sonarsource.github.io/rspec/#/rspec/S100/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
var functionExitSelector = [
  ':matches(',
  ['FunctionExpression', 'ArrowFunctionExpression', 'FunctionDeclaration'].join(','),
  ')',
  ':exit',
].join('');
var functionExpressionProperty = [
  'Property',
  '[key.type="Identifier"]',
  ':matches(',
  ['[value.type="FunctionExpression"]', '[value.type="ArrowFunctionExpression"]'].join(','),
  ')',
].join('');
var functionExpressionVariable = [
  'VariableDeclarator',
  '[id.type="Identifier"]',
  ':matches(',
  ['[init.type="FunctionExpression"]', '[init.type="ArrowFunctionExpression"]'].join(','),
  ')',
].join('');
exports.rule = {
  meta: {
    messages: {
      renameFunction:
        "Rename this '{{function}}' function to match the regular expression '{{format}}'.",
    },
  },
  create: function (context) {
    var _a;
    var format = context.options[0].format;
    var knowledgeStack = [];
    return (
      (_a = {}),
      (_a[functionExpressionProperty] = function (node) {
        knowledgeStack.push({
          node: node.key,
          func: node.value,
          returnsJSX: returnsJSX(node.value),
        });
      }),
      (_a[functionExpressionVariable] = function (node) {
        knowledgeStack.push({
          node: node.id,
          func: node.init,
          returnsJSX: returnsJSX(node.init),
        });
      }),
      (_a['MethodDefinition[key.type="Identifier"]'] = function (node) {
        knowledgeStack.push({
          node: node.key,
          func: node.value,
          returnsJSX: false,
        });
      }),
      (_a['FunctionDeclaration[id.type="Identifier"]'] = function (node) {
        knowledgeStack.push({
          node: node.id,
          func: node,
          returnsJSX: false,
        });
      }),
      (_a[functionExitSelector] = function (func) {
        var _a;
        if (
          func ===
          ((_a = (0, helpers_1.last)(knowledgeStack)) === null || _a === void 0 ? void 0 : _a.func)
        ) {
          var knowledge = knowledgeStack.pop();
          if (knowledge && !knowledge.returnsJSX) {
            var node = knowledge.node;
            if (!node.name.match(format)) {
              context.report({
                messageId: 'renameFunction',
                data: {
                  function: node.name,
                  format: format,
                },
                node: node,
              });
            }
          }
        }
      }),
      (_a.ReturnStatement = function (node) {
        var knowledge = (0, helpers_1.last)(knowledgeStack);
        var ancestors = context.getAncestors();
        for (var i = ancestors.length - 1; i >= 0; i--) {
          if (helpers_1.functionLike.has(ancestors[i].type)) {
            var enclosingFunction = ancestors[i];
            if (
              knowledge &&
              knowledge.func === enclosingFunction &&
              node.argument &&
              node.argument.type.startsWith('JSX')
            ) {
              knowledge.returnsJSX = true;
            }
            return;
          }
        }
      }),
      _a
    );
  },
};
//handling arrow functions without return statement
function returnsJSX(node) {
  return node.body.type.startsWith('JSX');
}
