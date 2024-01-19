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
// https://sonarsource.github.io/rspec/#/rspec/S2251/javascript
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
    return {
      ForStatement: function (node) {
        var forStatement = node;
        var test = forStatement.test;
        var loopIncrement = ForLoopIncrement.findInLoopUpdate(forStatement);
        if (test == null || loopIncrement == null || forStatement.update == null) {
          return;
        }
        var wrongDirection = getWrongDirection(test, loopIncrement);
        if (wrongDirection !== 0 && wrongDirection === loopIncrement.direction) {
          var movement = wrongDirection > 0 ? 'incremented' : 'decremented';
          var message = (0, helpers_1.toEncodedMessage)(
            '"'
              .concat(loopIncrement.identifier.name, '" is ')
              .concat(movement, ' and will never reach its stop condition.'),
            [test],
          );
          context.report({
            message: message,
            node: forStatement.update,
          });
        }
      },
    };
  },
};
var ForLoopIncrement = /** @class */ (function () {
  function ForLoopIncrement(increment, identifier, direction) {
    this.increment = increment;
    this.identifier = identifier;
    this.direction = direction;
  }
  ForLoopIncrement.findInLoopUpdate = function (forStatement) {
    var result = null;
    var expression = forStatement.update;
    if (!expression) {
      return null;
    }
    if (expression.type === 'UpdateExpression') {
      var updateExpression = expression;
      var direction = updateExpression.operator === '++' ? 1 : -1;
      result = ForLoopIncrement.increment(updateExpression, updateExpression.argument, direction);
    }
    if (expression.type === 'AssignmentExpression') {
      var assignmentExpression = expression;
      if (
        assignmentExpression.operator === '+=' &&
        assignmentExpression.left.type === 'Identifier'
      ) {
        result = ForLoopIncrement.increment(
          expression,
          assignmentExpression.left,
          directionFromValue(assignmentExpression.right),
        );
      }
      if (
        assignmentExpression.operator === '-=' &&
        assignmentExpression.left.type === 'Identifier'
      ) {
        result = ForLoopIncrement.increment(
          expression,
          assignmentExpression.left,
          -directionFromValue(assignmentExpression.right),
        );
      }
      if (assignmentExpression.operator === '=') {
        result = ForLoopIncrement.assignmentIncrement(assignmentExpression);
      }
    }
    return result;
  };
  ForLoopIncrement.increment = function (increment, expression, direction) {
    if (expression.type === 'Identifier') {
      return new ForLoopIncrement(increment, expression, direction);
    }
    return null;
  };
  ForLoopIncrement.assignmentIncrement = function (assignmentExpression) {
    var lhs = assignmentExpression.left;
    var rhs = assignmentExpression.right;
    if (
      lhs.type === 'Identifier' &&
      rhs.type === 'BinaryExpression' &&
      (rhs.operator === '+' || rhs.operator === '-')
    ) {
      var incrementDirection = directionFromValue(rhs.right);
      if (incrementDirection !== null && isSameIdentifier(rhs.left, lhs)) {
        incrementDirection = rhs.operator === '-' ? -incrementDirection : incrementDirection;
        return ForLoopIncrement.increment(assignmentExpression, lhs, incrementDirection);
      }
    }
    return null;
  };
  return ForLoopIncrement;
})();
function directionFromValue(expression) {
  if (expression.type === 'Literal') {
    var value = Number(expression.raw);
    if (isNaN(value) || value === 0) {
      return 0;
    }
    return value > 0 ? 1 : -1;
  }
  if (expression.type === 'UnaryExpression') {
    var unaryExpression = expression;
    if (unaryExpression.operator === '+') {
      return directionFromValue(unaryExpression.argument);
    }
    if (unaryExpression.operator === '-') {
      return -directionFromValue(unaryExpression.argument);
    }
  }
  return 0;
}
function getWrongDirection(condition, forLoopIncrement) {
  if (condition.type !== 'BinaryExpression') {
    return 0;
  }
  if (isSameIdentifier(condition.left, forLoopIncrement.identifier)) {
    if (condition.operator === '<' || condition.operator === '<=') {
      return -1;
    }
    if (condition.operator === '>' || condition.operator === '>=') {
      return +1;
    }
  } else if (isSameIdentifier(condition.right, forLoopIncrement.identifier)) {
    if (condition.operator === '<' || condition.operator === '<=') {
      return +1;
    }
    if (condition.operator === '>' || condition.operator === '>=') {
      return -1;
    }
  }
  return 0;
}
function isSameIdentifier(expression, identifier) {
  return expression.type === 'Identifier' && expression.name === identifier.name;
}
