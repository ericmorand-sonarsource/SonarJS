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
// https://sonarsource.github.io/rspec/#/rspec/S3415/javascript
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
var ASSERT_FUNCTIONS = [
  'equal',
  'notEqual',
  'strictEqual',
  'notStrictEqual',
  'deepEqual',
  'notDeepEqual',
  'closeTo',
  'approximately',
];
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
    var testCases = [];
    return {
      CallExpression: function (node) {
        if (helpers_1.Mocha.isTestCase(node)) {
          testCases.push(node);
          return;
        }
        if (testCases.length > 0) {
          checkInvertedArguments(node, context);
        }
      },
      'CallExpression:exit': function (node) {
        if (helpers_1.Mocha.isTestCase(node)) {
          testCases.pop();
        }
      },
    };
  },
};
function checkInvertedArguments(node, context) {
  var args = extractAssertionsArguments(node);
  if (args) {
    var actual_1 = args[0],
      expected_1 = args[1],
      format = args[2];
    if ((0, helpers_1.isLiteral)(actual_1) && !(0, helpers_1.isLiteral)(expected_1)) {
      var message = (0, helpers_1.toEncodedMessage)(
        'Swap these 2 arguments so they are in the correct order: '.concat(format, '.'),
        [actual_1],
        ['Other argument to swap.'],
      );
      context.report({
        node: expected_1,
        message: message,
        suggest: [
          {
            desc: 'Swap arguments',
            fix: function (fixer) {
              return [
                fixer.replaceText(actual_1, context.sourceCode.getText(expected_1)),
                fixer.replaceText(expected_1, context.sourceCode.getText(actual_1)),
              ];
            },
          },
        ],
      });
    }
  }
}
function extractAssertionsArguments(node) {
  var _a, _b;
  return (_b =
    (_a = extractAssertArguments(node)) !== null && _a !== void 0
      ? _a
      : extractExpectArguments(node)) !== null && _b !== void 0
    ? _b
    : extractFailArguments(node);
}
function extractAssertArguments(node) {
  if ((0, helpers_1.isMethodCall)(node) && node.arguments.length > 1) {
    var _a = node.callee,
      object = _a.object,
      property = _a.property,
      _b = node.arguments,
      actual = _b[0],
      expected = _b[1];
    if (
      (0, helpers_1.isIdentifier)(object, 'assert') &&
      helpers_1.isIdentifier.apply(void 0, __spreadArray([property], ASSERT_FUNCTIONS, false))
    ) {
      return [
        actual,
        expected,
        ''.concat(object.name, '.').concat(property.name, '(actual, expected)'),
      ];
    }
  }
  return null;
}
function extractExpectArguments(node) {
  if (node.callee.type !== 'MemberExpression') {
    return null;
  }
  var _a = node.callee,
    object = _a.object,
    property = _a.property;
  if (!(0, helpers_1.isIdentifier)(property, 'equal', 'eql', 'closeTo')) {
    return null;
  }
  while (object.type === 'MemberExpression') {
    object = object.object;
  }
  if (object.type === 'CallExpression' && (0, helpers_1.isIdentifier)(object.callee, 'expect')) {
    return [
      object.arguments[0],
      node.arguments[0],
      ''.concat(object.callee.name, '(actual).to.').concat(property.name, '(expected)'),
    ];
  }
  return null;
}
function extractFailArguments(node) {
  if ((0, helpers_1.isMethodCall)(node) && node.arguments.length > 1) {
    var _a = node.callee,
      object = _a.object,
      property = _a.property,
      _b = node.arguments,
      actual = _b[0],
      expected = _b[1];
    if (
      (0, helpers_1.isIdentifier)(object, 'assert', 'expect', 'should') &&
      (0, helpers_1.isIdentifier)(property, 'fail')
    ) {
      return [
        actual,
        expected,
        ''.concat(object.name, '.').concat(property.name, '(actual, expected)'),
      ];
    }
  }
  return null;
}
