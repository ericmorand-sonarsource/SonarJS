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
// https://sonarsource.github.io/rspec/#/rspec/S888/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
var allEqualityOperators = ['!=', '==', '!==', '==='];
var notEqualOperators = ['!==', '!='];
var plusMinusOperators = ['+=', '-='];
exports.rule = {
  meta: {
    messages: {
      replaceOperator:
        "Replace '{{operator}}' operator with one of '<=', '>=', '<', or '>' comparison operators.",
    },
  },
  create: function (context) {
    return {
      ForStatement: function (node) {
        var forStatement = node;
        if (!forStatement.test || !forStatement.update) {
          return;
        }
        var completeForStatement = node;
        var condition = completeForStatement.test;
        if (
          isEquality(condition) &&
          isUpdateIncDec(completeForStatement.update) &&
          !isException(completeForStatement, context)
        ) {
          context.report({
            messageId: 'replaceOperator',
            data: {
              operator: condition.operator,
            },
            node: condition,
          });
        }
      },
    };
  },
};
function isEquality(expression) {
  return (
    expression.type === 'BinaryExpression' && allEqualityOperators.includes(expression.operator)
  );
}
function isUpdateIncDec(expression) {
  if (isIncDec(expression) || expression.type === 'UpdateExpression') {
    return true;
  } else if (expression.type === 'SequenceExpression') {
    return expression.expressions.every(isUpdateIncDec);
  }
  return false;
}
function isIncDec(expression) {
  return (
    expression.type === 'AssignmentExpression' && plusMinusOperators.includes(expression.operator)
  );
}
function isException(forStatement, context) {
  return (
    isNontrivialConditionException(forStatement) ||
    isTrivialIteratorException(forStatement, context)
  );
}
function isNontrivialConditionException(forStatement) {
  //If we reach this point, we know that test is an equality kind
  var condition = forStatement.test;
  var counters = [];
  collectCounters(forStatement.update, counters);
  return condition.left.type !== 'Identifier' || !counters.includes(condition.left.name);
}
function collectCounters(expression, counters) {
  var counter = undefined;
  if (isIncDec(expression)) {
    counter = expression.left;
  } else if (expression.type === 'UpdateExpression') {
    counter = expression.argument;
  } else if (expression.type === 'SequenceExpression') {
    expression.expressions.forEach(function (e) {
      return collectCounters(e, counters);
    });
  }
  if (counter && counter.type === 'Identifier') {
    counters.push(counter.name);
  }
}
function isTrivialIteratorException(forStatement, context) {
  var init = forStatement.init;
  var condition = forStatement.test;
  if (init && isNotEqual(condition)) {
    var updatedByOne = checkForUpdateByOne(forStatement.update, forStatement.body, context);
    if (updatedByOne !== 0) {
      var beginValue = getValue(init);
      var endValue = getValue(condition);
      return (
        beginValue !== undefined &&
        endValue !== undefined &&
        updatedByOne === Math.sign(endValue - beginValue)
      );
    }
  }
  return false;
}
function isNotEqual(node) {
  return node.type === 'BinaryExpression' && notEqualOperators.includes(node.operator);
}
function checkForUpdateByOne(update, loopBody, context) {
  if (isUpdateByOne(update, loopBody, context)) {
    if (update.operator === '++' || update.operator === '+=') {
      return +1;
    }
    if (update.operator === '--' || update.operator === '-=') {
      return -1;
    }
  }
  return 0;
}
function isUpdateByOne(update, loopBody, context) {
  return (
    (update.type === 'UpdateExpression' && !isUsedInsideBody(update.argument, loopBody, context)) ||
    (isUpdateOnOneWithAssign(update) && !isUsedInsideBody(update.left, loopBody, context))
  );
}
function isUsedInsideBody(id, loopBody, context) {
  if (id.type === 'Identifier') {
    var variable = (0, helpers_1.getVariableFromName)(context, id.name);
    var bodyRange_1 = loopBody.range;
    if (variable && bodyRange_1) {
      return variable.references.some(function (ref) {
        return isInBody(ref.identifier, bodyRange_1);
      });
    }
  }
  return false;
}
function isInBody(id, bodyRange) {
  return (
    (id === null || id === void 0 ? void 0 : id.range) &&
    id.range[0] > bodyRange[0] &&
    id.range[1] < bodyRange[1]
  );
}
function getValue(node) {
  if (isNotEqual(node)) {
    return getInteger(node.right);
  } else if (isOneVarDeclaration(node)) {
    var variable = node.declarations[0];
    return getInteger(variable.init);
  } else if (node.type === 'AssignmentExpression') {
    return getInteger(node.right);
  }
  return undefined;
}
function getInteger(node) {
  if (node && node.type === 'Literal' && typeof node.value === 'number') {
    return node.value;
  }
  return undefined;
}
function isOneVarDeclaration(node) {
  return node.type === 'VariableDeclaration' && node.declarations.length === 1;
}
function isUpdateOnOneWithAssign(expression) {
  if (isIncDec(expression)) {
    var right = expression.right;
    return right.type === 'Literal' && right.value === 1;
  }
  return false;
}
