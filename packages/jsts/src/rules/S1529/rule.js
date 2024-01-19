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
// https://sonarsource.github.io/rspec/#/rspec/S1529/javascript
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod)
        if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  };
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
var ts = __importStar(require('typescript'));
var helpers_1 = require('../helpers');
var BITWISE_AND_OR = ['&', '|'];
var BITWISE_OPERATORS = [
  '&',
  '|',
  '^',
  '~',
  '<<',
  '>>',
  '>>>',
  '&=',
  '|=',
  '^=',
  '<<=',
  '>>=',
  '>>>=',
];
exports.rule = {
  create: function (context) {
    var isNumeric = getNumericTypeChecker(context);
    var lonelyBitwiseAndOr = null;
    var lonelyBitwiseAndOrAncestors = [];
    var fileContainsSeveralBitwiseOperations = false;
    return {
      BinaryExpression: function (node) {
        var expression = node;
        if (
          !lonelyBitwiseAndOr &&
          BITWISE_AND_OR.includes(expression.operator) &&
          !isNumeric(expression.left) &&
          !isNumeric(expression.right)
        ) {
          lonelyBitwiseAndOr = expression;
          lonelyBitwiseAndOrAncestors = __spreadArray([], context.getAncestors(), true);
        } else if (BITWISE_OPERATORS.includes(expression.operator)) {
          fileContainsSeveralBitwiseOperations = true;
        }
      },
      'Program:exit': function () {
        if (
          !fileContainsSeveralBitwiseOperations &&
          lonelyBitwiseAndOr &&
          insideCondition(lonelyBitwiseAndOr, lonelyBitwiseAndOrAncestors)
        ) {
          var op = lonelyBitwiseAndOr.operator;
          var operatorToken = context.sourceCode.getTokenAfter(lonelyBitwiseAndOr.left);
          if (operatorToken) {
            context.report({
              loc: operatorToken.loc,
              message: 'Review this use of bitwise "'
                .concat(op, '" operator; conditional "')
                .concat(op)
                .concat(op, '" might have been intended.'),
            });
          }
        }
      },
    };
  },
};
function insideCondition(node, ancestors) {
  var child = node;
  for (var i = ancestors.length - 1; i >= 0; i--) {
    var parent_1 = ancestors[i];
    if (
      parent_1.type === 'IfStatement' ||
      parent_1.type === 'ForStatement' ||
      parent_1.type === 'WhileStatement' ||
      parent_1.type === 'DoWhileStatement' ||
      parent_1.type === 'ConditionalExpression'
    ) {
      return parent_1.test === child;
    }
    child = parent_1;
  }
  return false;
}
function getNumericTypeChecker(context) {
  var services = context.sourceCode.parserServices;
  if (!!services && !!services.program && !!services.esTreeNodeToTSNodeMap) {
    return function (node) {
      return isNumericType((0, helpers_1.getTypeFromTreeNode)(node, services));
    };
  } else {
    var numericTypes_1 = ['number', 'bigint'];
    return function (node) {
      return node.type === 'Literal' ? numericTypes_1.includes(typeof node.value) : false;
    };
  }
  function isNumericType(type) {
    return (
      (type.getFlags() & (ts.TypeFlags.NumberLike | ts.TypeFlags.BigIntLike)) !== 0 ||
      (type.isUnionOrIntersection() && !!type.types.find(isNumericType))
    );
  }
}
