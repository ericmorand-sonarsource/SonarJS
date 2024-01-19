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
// https://sonarsource.github.io/rspec/#/rspec/S3516/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var locations_1 = require('eslint-plugin-sonarjs/lib/utils/locations');
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
    var functionContextStack = [];
    var checkOnFunctionExit = function (node) {
      return checkInvariantReturnStatements(
        node,
        functionContextStack[functionContextStack.length - 1],
      );
    };
    function checkInvariantReturnStatements(node, functionContext) {
      if (!functionContext || hasDifferentReturnTypes(functionContext)) {
        return;
      }
      var returnedValues = functionContext.returnStatements.map(function (returnStatement) {
        return returnStatement.argument;
      });
      if (areAllSameValue(returnedValues, context.getScope())) {
        var message = (0, helpers_1.toEncodedMessage)(
          'Refactor this function to not always return the same value.',
          returnedValues,
          returnedValues.map(function (_) {
            return 'Returned value.';
          }),
          returnedValues.length,
        );
        context.report({
          message: message,
          loc: (0, locations_1.getMainFunctionTokenLocation)(
            node,
            (0, helpers_1.getParent)(context),
            context,
          ),
        });
      }
    }
    return {
      onCodePathStart: function (codePath) {
        functionContextStack.push({
          codePath: codePath,
          containsReturnWithoutValue: false,
          returnStatements: [],
        });
      },
      onCodePathEnd: function () {
        functionContextStack.pop();
      },
      ReturnStatement: function (node) {
        var currentContext = functionContextStack[functionContextStack.length - 1];
        if (currentContext) {
          var returnStatement = node;
          currentContext.containsReturnWithoutValue =
            currentContext.containsReturnWithoutValue || !returnStatement.argument;
          currentContext.returnStatements.push(returnStatement);
        }
      },
      'FunctionDeclaration:exit': checkOnFunctionExit,
      'FunctionExpression:exit': checkOnFunctionExit,
      'ArrowFunctionExpression:exit': checkOnFunctionExit,
    };
  },
};
function hasDifferentReturnTypes(functionContext) {
  // As this method is called at the exit point of a function definition, the current
  // segments are the ones leading to the exit point at the end of the function. If they
  // are reachable, it means there is an implicit return.
  var hasImplicitReturn = functionContext.codePath.currentSegments.some(function (segment) {
    return segment.reachable;
  });
  return (
    hasImplicitReturn ||
    functionContext.containsReturnWithoutValue ||
    functionContext.returnStatements.length <= 1 ||
    functionContext.codePath.thrownSegments.length > 0
  );
}
function areAllSameValue(returnedValues, scope) {
  var firstReturnedValue = returnedValues[0];
  var firstValue = getLiteralValue(firstReturnedValue, scope);
  if (firstValue !== undefined) {
    return returnedValues.slice(1).every(function (returnedValue) {
      return getLiteralValue(returnedValue, scope) === firstValue;
    });
  } else if (firstReturnedValue.type === 'Identifier') {
    var singleWriteVariable = getSingleWriteDefinition(firstReturnedValue.name, scope);
    if (singleWriteVariable) {
      var readReferenceIdentifiers_1 = singleWriteVariable.variable.references
        .slice(1)
        .map(function (ref) {
          return ref.identifier;
        });
      return returnedValues.every(function (returnedValue) {
        return readReferenceIdentifiers_1.includes(returnedValue);
      });
    }
  }
  return false;
}
function getSingleWriteDefinition(variableName, scope) {
  var variable = scope.set.get(variableName);
  if (variable) {
    var references = variable.references.slice(1);
    if (
      !references.some(function (ref) {
        return ref.isWrite() || isPossibleObjectUpdate(ref);
      })
    ) {
      var initExpression = null;
      if (variable.defs.length === 1 && variable.defs[0].type === 'Variable') {
        initExpression = variable.defs[0].node.init;
      }
      return { variable: variable, initExpression: initExpression };
    }
  }
  return null;
}
function isPossibleObjectUpdate(ref) {
  var expressionStatement = (0, helpers_1.findFirstMatchingAncestor)(ref.identifier, function (n) {
    return n.type === 'ExpressionStatement' || helpers_1.FUNCTION_NODES.includes(n.type);
  });
  // To avoid FP, we consider method calls as write operations, since we do not know whether they will
  // update the object state or not.
  return (
    expressionStatement &&
    expressionStatement.type === 'ExpressionStatement' &&
    ((0, helpers_1.isElementWrite)(expressionStatement, ref) ||
      expressionStatement.expression.type === 'CallExpression')
  );
}
function getLiteralValue(returnedValue, scope) {
  if (returnedValue.type === 'Literal') {
    return returnedValue.value;
  } else if (returnedValue.type === 'UnaryExpression') {
    var innerReturnedValue = getLiteralValue(returnedValue.argument, scope);
    return innerReturnedValue !== undefined
      ? evaluateUnaryLiteralExpression(returnedValue.operator, innerReturnedValue)
      : undefined;
  } else if (returnedValue.type === 'Identifier') {
    var singleWriteVariable = getSingleWriteDefinition(returnedValue.name, scope);
    if (
      singleWriteVariable === null || singleWriteVariable === void 0
        ? void 0
        : singleWriteVariable.initExpression
    ) {
      return getLiteralValue(singleWriteVariable.initExpression, scope);
    }
  }
  return undefined;
}
function evaluateUnaryLiteralExpression(operator, innerReturnedValue) {
  switch (operator) {
    case '-':
      return -Number(innerReturnedValue);
    case '+':
      return Number(innerReturnedValue);
    case '~':
      return ~Number(innerReturnedValue);
    case '!':
      return !Boolean(innerReturnedValue);
    case 'typeof':
      return typeof innerReturnedValue;
    default:
      return undefined;
  }
}
