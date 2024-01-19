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
// https://sonarsource.github.io/rspec/#/rspec/S2870/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
var ArrayDeleteExpression = "UnaryExpression[operator='delete'] > MemberExpression[computed=true]";
exports.rule = {
  meta: {
    messages: {
      removeDelete: 'Remove this use of "delete".',
    },
  },
  create: function (context) {
    var _a;
    var services = context.sourceCode.parserServices;
    if ((0, helpers_1.isRequiredParserServices)(services)) {
      return (
        (_a = {}),
        (_a[ArrayDeleteExpression] = function (node) {
          var member = node;
          var object = member.object;
          if ((0, helpers_1.isArray)(object, services)) {
            raiseIssue(context);
          }
        }),
        _a
      );
    }
    return {};
  },
};
function raiseIssue(context) {
  var deleteKeyword = context.sourceCode.getFirstToken((0, helpers_1.getParent)(context));
  context.report({
    messageId: 'removeDelete',
    loc: deleteKeyword.loc,
  });
}
