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
// https://sonarsource.github.io/rspec/#/rspec/S4784/javascript
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
var stringMethods = ['match', 'search', 'split'];
var minPatternLength = 3;
var specialChars = ['+', '*', '{'];
exports.rule = {
  meta: {
    messages: {
      safeRegex: 'Make sure that using a regular expression is safe here.',
    },
  },
  create: function (context) {
    return {
      Literal: function (node) {
        var regex = node.regex;
        if (regex) {
          var pattern = regex.pattern;
          if (isUnsafeRegexLiteral(pattern)) {
            context.report({
              messageId: 'safeRegex',
              node: node,
            });
          }
        }
      },
      CallExpression: function (node) {
        var _a = node,
          callee = _a.callee,
          args = _a.arguments;
        if (
          helpers_1.isMemberWithProperty.apply(
            void 0,
            __spreadArray([callee], stringMethods, false),
          )
        ) {
          checkFirstArgument(args, context);
        }
      },
      NewExpression: function (node) {
        var _a = node,
          callee = _a.callee,
          args = _a.arguments;
        if ((0, helpers_1.isIdentifier)(callee, 'RegExp')) {
          checkFirstArgument(args, context);
        }
      },
    };
  },
};
function checkFirstArgument(args, context) {
  var firstArg = args[0];
  if (
    firstArg &&
    firstArg.type === 'Literal' &&
    typeof firstArg.value === 'string' &&
    isUnsafeRegexLiteral(firstArg.value)
  ) {
    context.report({
      messageId: 'safeRegex',
      node: firstArg,
    });
  }
}
function isUnsafeRegexLiteral(value) {
  return value.length >= minPatternLength && hasEnoughNumberOfSpecialChars(value);
}
function hasEnoughNumberOfSpecialChars(value) {
  var numberOfSpecialChars = 0;
  for (var _i = 0, value_1 = value; _i < value_1.length; _i++) {
    var c = value_1[_i];
    if (specialChars.includes(c)) {
      numberOfSpecialChars++;
    }
    if (numberOfSpecialChars === 2) {
      return true;
    }
  }
  return false;
}
