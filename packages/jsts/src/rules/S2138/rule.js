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
// https://sonarsource.github.io/rspec/#/rspec/S2138/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
exports.rule = {
  meta: {
    messages: {
      useNull: 'Use null instead.',
    },
  },
  create: function (context) {
    function raiseOnUndefined(node) {
      if ((0, helpers_1.isUndefined)(node)) {
        context.report({
          messageId: 'useNull',
          node: node,
        });
      }
    }
    return {
      VariableDeclarator: function (node) {
        var init = node.init;
        if (init) {
          raiseOnUndefined(init);
        }
      },
      AssignmentExpression: function (node) {
        var right = node.right;
        raiseOnUndefined(right);
      },
      Property: function (node) {
        var value = node.value;
        raiseOnUndefined(value);
      },
    };
  },
};
