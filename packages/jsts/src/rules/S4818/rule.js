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
// https://sonarsource.github.io/rspec/#/rspec/S4818/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
exports.rule = {
  meta: {
    messages: {
      safeSocket: 'Make sure that sockets are used safely here.',
    },
  },
  create: function (context) {
    return {
      NewExpression: function (node) {
        return checkCallExpression(node, context, 'net.Socket');
      },
      CallExpression: function (node) {
        return checkCallExpression(node, context, 'net.createConnection', 'net.connect');
      },
    };
  },
};
function checkCallExpression(callExpr, context) {
  var sensitiveFqns = [];
  for (var _i = 2; _i < arguments.length; _i++) {
    sensitiveFqns[_i - 2] = arguments[_i];
  }
  var callFqn = (0, helpers_1.getFullyQualifiedName)(context, callExpr);
  if (
    sensitiveFqns.some(function (sensitiveFqn) {
      return sensitiveFqn === callFqn;
    })
  ) {
    context.report({ messageId: 'safeSocket', node: callExpr.callee });
  }
}
