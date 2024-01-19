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
// https://sonarsource.github.io/rspec/#/rspec/S5863/javascript
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
var equivalence_1 = require('eslint-plugin-sonarjs/lib/utils/equivalence');
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
    if (!helpers_1.Chai.isImported(context)) {
      return {};
    }
    return {
      ExpressionStatement: function (node) {
        var expression = node.expression;
        checkExpect(context, expression);
        checkShould(context, expression);
        checkAssert(context, expression);
      },
    };
  },
};
function checkAssert(context, expression) {
  if (expression.type === 'CallExpression') {
    var callee = expression.callee,
      args = expression.arguments;
    if (
      callee.type === 'MemberExpression' &&
      (0, helpers_1.isIdentifier)(callee.object, 'assert')
    ) {
      findDuplicates(context, args);
    }
  }
}
function checkExpect(context, expression) {
  var currentExpression = expression;
  var args = [];
  while (true) {
    if (currentExpression.type === 'CallExpression') {
      args = __spreadArray(__spreadArray([], currentExpression.arguments, true), args, true);
      currentExpression = currentExpression.callee;
    } else if (currentExpression.type === 'MemberExpression') {
      currentExpression = currentExpression.object;
    } else if ((0, helpers_1.isIdentifier)(currentExpression, 'expect')) {
      break;
    } else {
      return;
    }
  }
  findDuplicates(context, args);
}
function checkShould(context, expression) {
  var currentExpression = expression;
  var args = [];
  var hasShould = false;
  while (true) {
    if (currentExpression.type === 'CallExpression') {
      args = __spreadArray(__spreadArray([], currentExpression.arguments, true), args, true);
      currentExpression = currentExpression.callee;
    } else if (currentExpression.type === 'MemberExpression') {
      if ((0, helpers_1.isIdentifier)(currentExpression.property, 'should')) {
        hasShould = true;
      }
      currentExpression = currentExpression.object;
    } else if ((0, helpers_1.isIdentifier)(currentExpression, 'should')) {
      break;
    } else if (hasShould) {
      args = __spreadArray([currentExpression], args, true);
      break;
    } else {
      return;
    }
  }
  findDuplicates(context, args);
}
function findDuplicates(context, args) {
  var castedContext = context.sourceCode;
  for (var i = 0; i < args.length; i++) {
    for (var j = i + 1; j < args.length; j++) {
      var duplicates = (0, equivalence_1.areEquivalent)(args[i], args[j], castedContext);
      if (duplicates && !(0, helpers_1.isLiteral)(args[i])) {
        var message = (0, helpers_1.toEncodedMessage)('Replace this argument or its duplicate.', [
          args[j],
        ]);
        context.report({ message: message, node: args[i] });
      }
    }
  }
}
