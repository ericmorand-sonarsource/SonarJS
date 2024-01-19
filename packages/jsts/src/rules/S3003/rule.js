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
// https://sonarsource.github.io/rspec/#/rspec/S3003/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
var parameters_1 = require('../../linter/parameters');
exports.rule = {
  meta: {
    schema: [
      {
        // internal parameter for rules having secondary locations
        enum: [parameters_1.SONAR_RUNTIME],
      },
    ],
  },
  create: function (context) {
    var services = context.sourceCode.parserServices;
    if (!(0, helpers_1.isRequiredParserServices)(services)) {
      return {};
    }
    return {
      BinaryExpression: function (node) {
        var _a = node,
          operator = _a.operator,
          left = _a.left,
          right = _a.right;
        if (
          ['<', '<=', '>', '>='].includes(operator) &&
          (0, helpers_1.isString)(left, services) &&
          (0, helpers_1.isString)(right, services) &&
          !isLiteralException(left) &&
          !isLiteralException(right) &&
          !isWithinSortCallback(context)
        ) {
          context.report({
            message: (0, helpers_1.toEncodedMessage)(
              'Convert operands of this use of "'.concat(operator, '" to number type.'),
              [left, right],
            ),
            loc: context.sourceCode.getTokensBetween(left, right).find(function (token) {
              return token.type === 'Punctuator' && token.value === operator;
            }).loc,
          });
        }
      },
    };
  },
};
function isLiteralException(node) {
  return node.type === 'Literal' && node.raw.length === 3;
}
function isWithinSortCallback(context) {
  var ancestors = context.getAncestors().reverse();
  var maybeCallback = ancestors.find(function (node) {
    return ['ArrowFunctionExpression', 'FunctionExpression'].includes(node.type);
  });
  if (maybeCallback) {
    var callback_1 = maybeCallback;
    var parent_1 = callback_1.parent;
    if ((parent_1 === null || parent_1 === void 0 ? void 0 : parent_1.type) === 'CallExpression') {
      var callee = parent_1.callee,
        args = parent_1.arguments;
      var funcName = void 0;
      if (callee.type === 'Identifier') {
        funcName = callee.name;
      } else if (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') {
        funcName = callee.property.name;
      }
      return (
        (funcName === null || funcName === void 0 ? void 0 : funcName.match(/sort/i)) &&
        args.some(function (arg) {
          return arg === callback_1;
        })
      );
    }
  }
  return false;
}
