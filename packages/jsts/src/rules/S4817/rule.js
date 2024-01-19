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
// https://sonarsource.github.io/rspec/#/rspec/S4817/javascript
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
var xpathModule = 'xpath';
var xpathEvalMethods = ['select', 'select1', 'evaluate'];
var ieEvalMethods = ['selectNodes', 'SelectSingleNode'];
exports.rule = {
  meta: {
    messages: {
      checkXPath: 'Make sure that executing this XPATH expression is safe.',
    },
  },
  create: function (context) {
    return {
      MemberExpression: function (node) {
        if ((0, helpers_1.isMemberExpression)(node, 'document', 'evaluate')) {
          context.report({ messageId: 'checkXPath', node: node });
        }
      },
      CallExpression: function (node) {
        return checkCallExpression(node, context);
      },
    };
  },
};
function checkCallExpression(_a, context) {
  var callee = _a.callee,
    args = _a.arguments;
  if (args.length > 0 && (0, helpers_1.isLiteral)(args[0])) {
    return;
  }
  // IE
  if (
    helpers_1.isMemberWithProperty.apply(void 0, __spreadArray([callee], ieEvalMethods, false)) &&
    args.length === 1
  ) {
    context.report({ messageId: 'checkXPath', node: callee });
    return;
  }
  // Document.evaluate
  if (
    (0, helpers_1.isMemberWithProperty)(callee, 'evaluate') &&
    !(0, helpers_1.isMemberExpression)(callee, 'document', 'evaluate') &&
    args.length >= 4
  ) {
    var resultTypeArgument = args[3];
    var argumentAsText = context.sourceCode.getText(resultTypeArgument);
    if (argumentAsText.includes('XPathResult')) {
      context.report({ messageId: 'checkXPath', node: callee });
      return;
    }
  }
  // "xpath" module
  var fqn = (0, helpers_1.getFullyQualifiedName)(context, callee);
  if (
    xpathEvalMethods.some(function (method) {
      return fqn === ''.concat(xpathModule, '.').concat(method);
    })
  ) {
    context.report({ messageId: 'checkXPath', node: callee });
  }
}
