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
// https://sonarsource.github.io/rspec/#/rspec/S1533/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var WRAPPER_TYPES = ['Boolean', 'Number', 'String'];
exports.rule = {
  meta: {
    hasSuggestions: true,
    messages: {
      removeConstructor: 'Remove this use of "{{constructor}}" constructor.',
      replaceWrapper:
        'Replace this "{{wrapper}}" wrapper object with primitive type "{{primitive}}".',
      suggestRemoveNew: 'Remove "new" operator',
      suggestReplaceWrapper: 'Replace "{{wrapper}}" with "{{primitive}}"',
    },
  },
  create: function (context) {
    return {
      NewExpression: function (node) {
        var konstructor = node.callee;
        if (konstructor.type === 'Identifier' && WRAPPER_TYPES.includes(konstructor.name)) {
          var newToken = context.sourceCode.getFirstToken(node, function (token) {
            return token.value === 'new';
          });
          var _a = newToken.range,
            begin_1 = _a[0],
            end_1 = _a[1];
          context.report({
            messageId: 'removeConstructor',
            data: {
              constructor: konstructor.name,
            },
            node: node,
            suggest: [
              {
                messageId: 'suggestRemoveNew',
                fix: function (fixer) {
                  return fixer.removeRange([begin_1, end_1 + 1]);
                },
              },
            ],
          });
        }
      },
      TSTypeReference: function (node) {
        var typeString = context.sourceCode.getText(node);
        if (WRAPPER_TYPES.includes(typeString)) {
          var primitiveType_1 = typeString.toLowerCase();
          context.report({
            messageId: 'replaceWrapper',
            data: {
              wrapper: typeString,
              primitive: primitiveType_1,
            },
            node: node,
            suggest: [
              {
                messageId: 'suggestReplaceWrapper',
                data: {
                  wrapper: typeString,
                  primitive: primitiveType_1,
                },
                fix: function (fixer) {
                  return fixer.replaceText(node, primitiveType_1);
                },
              },
            ],
          });
        }
      },
    };
  },
};
