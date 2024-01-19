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
// https://sonarsource.github.io/rspec/#/rspec/S101/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
exports.rule = {
  meta: {
    messages: {
      renameClass: 'Rename {{symbolType}} "{{symbol}}" to match the regular expression {{format}}.',
    },
  },
  create: function (context) {
    return {
      ClassDeclaration: function (node) {
        return checkName(node, 'class', context);
      },
      TSInterfaceDeclaration: function (node) {
        return checkName(node, 'interface', context);
      },
    };
  },
};
function checkName(node, declarationType, context) {
  var format = context.options[0].format;
  if (node.id) {
    var name_1 = node.id.name;
    if (!name_1.match(format)) {
      context.report({
        messageId: 'renameClass',
        data: {
          symbol: name_1,
          symbolType: declarationType,
          format: format,
        },
        node: node.id,
      });
    }
  }
}
