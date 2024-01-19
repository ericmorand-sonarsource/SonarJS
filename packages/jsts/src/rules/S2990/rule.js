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
// https://sonarsource.github.io/rspec/#/rspec/S2990/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
exports.rule = {
  meta: {
    hasSuggestions: true,
    messages: {
      removeThis: 'Remove the use of "this".',
      suggestRemoveThis: 'Remove "this"',
      suggestUseWindow: 'Replace "this" with "window" object',
    },
  },
  create: function (context) {
    return {
      'MemberExpression[object.type="ThisExpression"]': function (node) {
        var memberExpression = node;
        var scopeType = context.getScope().variableScope.type;
        var isInsideClass = context.getAncestors().some(function (ancestor) {
          return ancestor.type === 'ClassDeclaration' || ancestor.type === 'ClassExpression';
        });
        if ((scopeType === 'global' || scopeType === 'module') && !isInsideClass) {
          var suggest = [];
          if (!memberExpression.computed) {
            var propertyText_1 = context.sourceCode.getText(memberExpression.property);
            suggest.push(
              {
                messageId: 'suggestRemoveThis',
                fix: function (fixer) {
                  return fixer.replaceText(node, propertyText_1);
                },
              },
              {
                messageId: 'suggestUseWindow',
                fix: function (fixer) {
                  return fixer.replaceText(memberExpression.object, 'window');
                },
              },
            );
          }
          context.report({
            messageId: 'removeThis',
            node: memberExpression.object,
            suggest: suggest,
          });
        }
      },
    };
  },
};
