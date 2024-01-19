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
// https://sonarsource.github.io/rspec/#/rspec/S3499/javascript
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
    function raiseIssue(node, begin, end, positionMessage) {
      var properties = node.properties;
      var secondaryNodes = [];
      var secondaryMessages = [];
      for (var i = begin; i < end; i++) {
        var prop = properties[i];
        if (prop.shorthand) {
          secondaryNodes.push(prop);
          secondaryMessages.push('Move to '.concat(positionMessage));
        }
      }
      var message = (0, helpers_1.toEncodedMessage)(
        'Group all shorthand properties at '.concat(
          positionMessage,
          ' of this object declaration.',
        ),
        secondaryNodes,
        secondaryMessages,
      );
      context.report({
        message: message,
        loc: context.sourceCode.getFirstToken(node).loc,
      });
    }
    return {
      ObjectExpression: function (node) {
        var objectExpression = node;
        var objectExpressionProperties = objectExpression.properties;
        if (
          objectExpressionProperties.some(function (p) {
            return p.type !== 'Property';
          })
        ) {
          return;
        }
        var isShorthandPropertyList = objectExpressionProperties.map(function (p) {
          return p.shorthand;
        });
        var shorthandPropertiesNumber = isShorthandPropertyList.filter(function (b) {
          return b;
        }).length;
        var numberOfShorthandAtBeginning = getNumberOfTrueAtBeginning(isShorthandPropertyList);
        var numberOfShorthandAtEnd = getNumberOfTrueAtBeginning(
          __spreadArray([], isShorthandPropertyList, true).reverse(),
        );
        var allAtBeginning = numberOfShorthandAtBeginning === shorthandPropertiesNumber;
        var allAtEnd = numberOfShorthandAtEnd === shorthandPropertiesNumber;
        var propertiesNumber = isShorthandPropertyList.length;
        if (!allAtBeginning && numberOfShorthandAtBeginning > numberOfShorthandAtEnd) {
          raiseIssue(
            objectExpression,
            numberOfShorthandAtBeginning,
            propertiesNumber,
            'the beginning',
          );
        } else if (!allAtEnd && numberOfShorthandAtEnd > numberOfShorthandAtBeginning) {
          raiseIssue(objectExpression, 0, propertiesNumber - numberOfShorthandAtEnd, 'the end');
        } else if (!allAtBeginning && !allAtEnd) {
          raiseIssue(objectExpression, 0, propertiesNumber, 'either the beginning or end');
        }
      },
    };
  },
};
function getNumberOfTrueAtBeginning(list) {
  var numberOfTrueAtBeginning = 0;
  for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
    var b = list_1[_i];
    if (b) {
      numberOfTrueAtBeginning++;
    } else {
      break;
    }
  }
  return numberOfTrueAtBeginning;
}
