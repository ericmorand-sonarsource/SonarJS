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
// https://sonarsource.github.io/rspec/#/rspec/S3757/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var typescript_1 = require('typescript');
var helpers_1 = require('../helpers');
var BINARY_OPERATORS = ['/', '*', '%', '-', '-=', '*=', '/=', '%='];
var UNARY_OPERATORS = ['++', '--', '+', '-'];
exports.rule = {
  meta: {
    messages: {
      noEvaluatedNaN:
        'Change the expression which uses this operand so that it can\'t evaluate to "NaN" (Not a Number).',
    },
  },
  create: function (context) {
    var services = context.sourceCode.parserServices;
    if (!(0, helpers_1.isRequiredParserServices)(services)) {
      return {};
    }
    function isObjectType() {
      var types = [];
      for (var _i = 0; _i < arguments.length; _i++) {
        types[_i] = arguments[_i];
      }
      return types.some(function (t) {
        var _a;
        return (
          !!(t.getFlags() & typescript_1.TypeFlags.Object) &&
          !isDate(t) &&
          ((_a = t.symbol) === null || _a === void 0 ? void 0 : _a.name) !== 'Number'
        );
      });
    }
    function isDate(type) {
      var typeToString = services.program.getTypeChecker().typeToString;
      return typeToString(type) === 'Date';
    }
    return {
      'BinaryExpression, AssignmentExpression': function (node) {
        var expression = node;
        if (!BINARY_OPERATORS.includes(expression.operator)) {
          return;
        }
        var leftType = (0, helpers_1.getTypeFromTreeNode)(expression.left, services);
        var rightType = (0, helpers_1.getTypeFromTreeNode)(expression.right, services);
        if (isObjectType(leftType)) {
          context.report({ node: expression.left, messageId: 'noEvaluatedNaN' });
        }
        if (isObjectType(rightType)) {
          context.report({ node: expression.right, messageId: 'noEvaluatedNaN' });
        }
      },
      'UnaryExpression, UpdateExpression': function (node) {
        var expr = node;
        if (!UNARY_OPERATORS.includes(expr.operator)) {
          return;
        }
        var argType = (0, helpers_1.getTypeFromTreeNode)(expr.argument, services);
        if (isObjectType(argType)) {
          context.report({ node: node, messageId: 'noEvaluatedNaN' });
        }
      },
    };
  },
};
