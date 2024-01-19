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
// https://sonarsource.github.io/rspec/#/rspec/S6080/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
var MESSAGE =
  'Set this timeout to 0 if you want to disable it, otherwise use a value lower than 2147483648.';
var MAX_DELAY_VALUE = 2147483647;
exports.rule = {
  create: function (context) {
    if (!helpers_1.Chai.isImported(context)) {
      return {};
    }
    var constructs = [];
    return {
      CallExpression: function (node) {
        if (helpers_1.Mocha.isTestConstruct(node)) {
          constructs.push(node);
          return;
        }
        if (constructs.length > 0) {
          checkTimeoutDisabling(node, context);
        }
      },
      'CallExpression:exit': function (node) {
        if (helpers_1.Mocha.isTestConstruct(node)) {
          constructs.pop();
        }
      },
    };
  },
};
function checkTimeoutDisabling(node, context) {
  if ((0, helpers_1.isMethodCall)(node) && node.arguments.length > 0) {
    var _a = node.callee,
      object = _a.object,
      property = _a.property,
      value = node.arguments[0];
    if (
      (0, helpers_1.isThisExpression)(object) &&
      (0, helpers_1.isIdentifier)(property, 'timeout') &&
      isDisablingTimeout(value, context)
    ) {
      context.report({
        message: MESSAGE,
        node: value,
      });
    }
  }
}
function isDisablingTimeout(timeout, context) {
  var usage = (0, helpers_1.getUniqueWriteUsageOrNode)(context, timeout);
  return (0, helpers_1.isNumberLiteral)(usage) && usage.value > MAX_DELAY_VALUE;
}
