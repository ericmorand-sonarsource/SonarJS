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
// https://sonarsource.github.io/rspec/#/rspec/S4507/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
var ERRORHANDLER_MODULE = 'errorhandler';
exports.rule = {
  meta: {
    messages: {
      deactivateDebug:
        'Make sure this debug feature is deactivated before delivering the code in production.',
    },
  },
  create: function (context) {
    return {
      CallExpression: function (node) {
        var callExpression = node;
        // app.use(...)
        checkErrorHandlerMiddleware(context, callExpression);
      },
    };
  },
};
function checkErrorHandlerMiddleware(context, callExpression) {
  var callee = callExpression.callee,
    args = callExpression.arguments;
  if (
    (0, helpers_1.isMemberWithProperty)(callee, 'use') &&
    args.length > 0 &&
    !isInsideConditional(context)
  ) {
    for (var _i = 0, _a = (0, helpers_1.flattenArgs)(context, args); _i < _a.length; _i++) {
      var m = _a[_i];
      var middleware = (0, helpers_1.getUniqueWriteUsageOrNode)(context, m);
      if (
        middleware.type === 'CallExpression' &&
        (0, helpers_1.getFullyQualifiedName)(context, middleware) === ERRORHANDLER_MODULE
      ) {
        context.report({
          node: middleware,
          messageId: 'deactivateDebug',
        });
      }
    }
  }
}
function isInsideConditional(context) {
  var ancestors = context.getAncestors();
  return ancestors.some(function (ancestor) {
    return ancestor.type === 'IfStatement';
  });
}
