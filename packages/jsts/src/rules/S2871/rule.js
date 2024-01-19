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
// https://sonarsource.github.io/rspec/#/rspec/S2871/javascript
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
var compareNumberFunctionPlaceholder = '(a, b) => (a - b)';
var compareBigIntFunctionPlaceholder = [
  '(a, b) => {',
  '  if (a < b) {',
  '    return -1;',
  '  } else if (a > b) {',
  '    return 1;',
  '  } else {',
  '    return 0;',
  '  }',
  '}',
];
var languageSensitiveOrderPlaceholder = '(a, b) => a.localeCompare(b)';
exports.rule = {
  meta: {
    hasSuggestions: true,
    messages: {
      provideCompareFunction:
        'Provide a compare function to avoid sorting elements alphabetically.',
      suggestNumericOrder: 'Add a comparator function to sort in ascending order',
      suggestLanguageSensitiveOrder:
        'Add a comparator function to sort in ascending language-sensitive order',
    },
  },
  create: function (context) {
    var sourceCode = context.sourceCode;
    var services = context.sourceCode.parserServices;
    if (!(0, helpers_1.isRequiredParserServices)(services)) {
      return {};
    }
    return {
      'CallExpression[arguments.length=0][callee.type="MemberExpression"]': function (call) {
        var _a = call.callee,
          object = _a.object,
          node = _a.property;
        var text = sourceCode.getText(node);
        var type = (0, helpers_1.getTypeFromTreeNode)(object, services);
        if (
          __spreadArray(
            __spreadArray([], helpers_1.sortLike, true),
            helpers_1.copyingSortLike,
            true,
          ).includes(text) &&
          (0, helpers_1.isArrayLikeType)(type, services)
        ) {
          var suggest = getSuggestions(call, type);
          context.report({ node: node, suggest: suggest, messageId: 'provideCompareFunction' });
        }
      },
    };
    function getSuggestions(call, type) {
      var suggestions = [];
      if ((0, helpers_1.isNumberArray)(type, services)) {
        suggestions.push({
          messageId: 'suggestNumericOrder',
          fix: fixer(call, compareNumberFunctionPlaceholder),
        });
      } else if ((0, helpers_1.isBigIntArray)(type, services)) {
        suggestions.push({
          messageId: 'suggestNumericOrder',
          fix: fixer.apply(void 0, __spreadArray([call], compareBigIntFunctionPlaceholder, false)),
        });
      } else if ((0, helpers_1.isStringArray)(type, services)) {
        suggestions.push({
          messageId: 'suggestLanguageSensitiveOrder',
          fix: fixer(call, languageSensitiveOrderPlaceholder),
        });
      }
      return suggestions;
    }
    function fixer(call) {
      var _a;
      var placeholder = [];
      for (var _i = 1; _i < arguments.length; _i++) {
        placeholder[_i - 1] = arguments[_i];
      }
      var closingParenthesis = sourceCode.getLastToken(call, function (token) {
        return token.value === ')';
      });
      var indent = ' '.repeat((_a = call.loc) === null || _a === void 0 ? void 0 : _a.start.column);
      var text = placeholder.join('\n'.concat(indent));
      return function (fixer) {
        return fixer.insertTextBefore(closingParenthesis, text);
      };
    }
  },
};
