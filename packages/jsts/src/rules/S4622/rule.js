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
// https://sonarsource.github.io/rspec/#/rspec/S4622/javascript
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
exports.rule = {
  meta: {
    messages: {
      refactorUnion: 'Refactor this union type to have less than {{threshold}} elements.',
    },
  },
  create: function (context) {
    return {
      TSUnionType: function (node) {
        var union = node;
        if (isUsedWithUtilityType(union)) {
          return;
        }
        var threshold = context.options[0];
        if (union.types.length > threshold && !isFromTypeStatement(union)) {
          context.report({
            messageId: 'refactorUnion',
            data: {
              threshold: threshold,
            },
            node: node,
          });
        }
      },
    };
  },
};
function isFromTypeStatement(node) {
  return node.parent.type === 'TSTypeAliasDeclaration';
}
function isUsedWithUtilityType(node) {
  return (
    node.parent.type === 'TSTypeParameterInstantiation' &&
    node.parent.parent.type === 'TSTypeReference' &&
    helpers_1.isIdentifier.apply(
      void 0,
      __spreadArray([node.parent.parent.typeName], helpers_1.UTILITY_TYPES, false),
    )
  );
}
