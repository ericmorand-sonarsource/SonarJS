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
// https://sonarsource.github.io/rspec/#/rspec/S3403/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
var parameters_1 = require('../../linter/parameters');
exports.rule = {
  meta: {
    hasSuggestions: true,
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
    function isComparableTo(lhs, rhs) {
      var checker = services.program.getTypeChecker();
      var lhsType = checker.getBaseTypeOfLiteralType(
        (0, helpers_1.getTypeFromTreeNode)(lhs, services),
      );
      var rhsType = checker.getBaseTypeOfLiteralType(
        (0, helpers_1.getTypeFromTreeNode)(rhs, services),
      );
      // @ts-ignore private API
      return (
        checker.isTypeAssignableTo(lhsType, rhsType) || checker.isTypeAssignableTo(rhsType, lhsType)
      );
    }
    return {
      BinaryExpression: function (node) {
        var _a = node,
          left = _a.left,
          operator = _a.operator,
          right = _a.right;
        if (['===', '!=='].includes(operator) && !isComparableTo(left, right)) {
          var _b = operator === '===' ? ['===', '==', 'false'] : ['!==', '!=', 'true'],
            actual = _b[0],
            expected_1 = _b[1],
            outcome = _b[2];
          var operatorToken_1 = context.sourceCode
            .getTokensBetween(left, right)
            .find(function (token) {
              return token.type === 'Punctuator' && token.value === operator;
            });
          context.report({
            message: (0, helpers_1.toEncodedMessage)(
              'Remove this "'
                .concat(actual, '" check; it will always be ')
                .concat(outcome, '. Did you mean to use "')
                .concat(expected_1, '"?'),
              [left, right],
            ),
            loc: operatorToken_1.loc,
            suggest: [
              {
                desc: 'Replace "'.concat(actual, '" with "').concat(expected_1, '"'),
                fix: function (fixer) {
                  return fixer.replaceText(operatorToken_1, expected_1);
                },
              },
            ],
          });
        }
      },
    };
  },
};
