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
// https://sonarsource.github.io/rspec/#/rspec/S2234/javascript
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
    var services = context.sourceCode.parserServices;
    var canResolveType = (0, helpers_1.isRequiredParserServices)(services);
    function checkArguments(functionCall) {
      var resolvedFunction = resolveFunctionDeclaration(functionCall);
      if (!resolvedFunction) {
        return;
      }
      var functionParameters = resolvedFunction.params,
        functionDeclaration = resolvedFunction.declaration;
      var argumentNames = functionCall.arguments.map(function (arg) {
        var argument = arg;
        return argument.type === 'Identifier' ? argument.name : undefined;
      });
      for (var argumentIndex = 0; argumentIndex < argumentNames.length; argumentIndex++) {
        var argumentName = argumentNames[argumentIndex];
        if (argumentName) {
          var swappedArgumentName = getSwappedArgumentName(
            argumentNames,
            functionParameters,
            argumentName,
            argumentIndex,
            functionCall,
          );
          if (swappedArgumentName && !areComparedArguments([argumentName, swappedArgumentName])) {
            raiseIssue(argumentName, swappedArgumentName, functionDeclaration, functionCall);
            return;
          }
        }
      }
    }
    function areComparedArguments(argumentNames) {
      function getName(node) {
        switch (node.type) {
          case 'Identifier':
            return node.name;
          case 'CallExpression':
            return getName(node.callee);
          case 'MemberExpression':
            return getName(node.object);
          default:
            return undefined;
        }
      }
      function checkComparedArguments(lhs, rhs) {
        return (
          [lhs, rhs].map(getName).filter(function (name) {
            return name && argumentNames.includes(name);
          }).length === argumentNames.length
        );
      }
      var maybeIfStmt = context
        .getAncestors()
        .reverse()
        .find(function (ancestor) {
          return ancestor.type === 'IfStatement';
        });
      if (maybeIfStmt) {
        var test_1 = maybeIfStmt.test;
        switch (test_1.type) {
          case 'BinaryExpression': {
            var binExpr = test_1;
            if (['==', '!=', '===', '!==', '<', '<=', '>', '>='].includes(binExpr.operator)) {
              var lhs = binExpr.left,
                rhs = binExpr.right;
              return checkComparedArguments(lhs, rhs);
            }
            break;
          }
          case 'CallExpression': {
            var callExpr = test_1;
            if (callExpr.arguments.length === 1 && callExpr.callee.type === 'MemberExpression') {
              var _a = [callExpr.callee.object, callExpr.arguments[0]],
                lhs = _a[0],
                rhs = _a[1];
              return checkComparedArguments(lhs, rhs);
            }
            break;
          }
        }
      }
      return false;
    }
    function resolveFunctionDeclaration(node) {
      if (canResolveType) {
        return resolveFromTSSignature(node);
      }
      var functionDeclaration = null;
      if ((0, helpers_1.isFunctionNode)(node.callee)) {
        functionDeclaration = node.callee;
      } else if (node.callee.type === 'Identifier') {
        functionDeclaration = (0, helpers_1.resolveFromFunctionReference)(context, node.callee);
      }
      if (!functionDeclaration) {
        return null;
      }
      return {
        params: extractFunctionParameters(functionDeclaration),
        declaration: functionDeclaration,
      };
    }
    function resolveFromTSSignature(node) {
      var signature = (0, helpers_1.getSignatureFromCallee)(node, services);
      if (signature === null || signature === void 0 ? void 0 : signature.declaration) {
        return {
          params: signature.parameters.map(function (param) {
            return param.name;
          }),
          declaration: services.tsNodeToESTreeNodeMap.get(signature.declaration),
        };
      }
      return null;
    }
    function getSwappedArgumentName(
      argumentNames,
      functionParameters,
      argumentName,
      argumentIndex,
      node,
    ) {
      var indexInFunctionDeclaration = functionParameters.findIndex(function (
        functionParameterName,
      ) {
        return functionParameterName === argumentName;
      });
      if (indexInFunctionDeclaration >= 0 && indexInFunctionDeclaration !== argumentIndex) {
        var potentiallySwappedArgument = argumentNames[indexInFunctionDeclaration];
        if (
          potentiallySwappedArgument &&
          potentiallySwappedArgument === functionParameters[argumentIndex] &&
          haveCompatibleTypes(
            node.arguments[argumentIndex],
            node.arguments[indexInFunctionDeclaration],
          )
        ) {
          return potentiallySwappedArgument;
        }
      }
      return null;
    }
    function haveCompatibleTypes(arg1, arg2) {
      if (canResolveType) {
        var type1 = normalizeType((0, helpers_1.getTypeAsString)(arg1, services));
        var type2 = normalizeType((0, helpers_1.getTypeAsString)(arg2, services));
        return type1 === type2;
      }
      return true;
    }
    function raiseIssue(arg1, arg2, functionDeclaration, node) {
      var primaryMessage = "Arguments '"
        .concat(arg1, "' and '")
        .concat(arg2, "' have the same names but not the same order as the function parameters.");
      var encodedMessage = {
        message: primaryMessage,
        secondaryLocations: getSecondaryLocations(functionDeclaration),
      };
      context.report({
        message: JSON.stringify(encodedMessage),
        loc: getParametersClauseLocation(node.arguments),
      });
    }
    return {
      NewExpression: function (node) {
        checkArguments(node);
      },
      CallExpression: function (node) {
        checkArguments(node);
      },
    };
  },
};
function extractFunctionParameters(functionDeclaration) {
  return functionDeclaration.params.map(function (param) {
    var identifiers = (0, helpers_1.resolveIdentifiers)(param);
    if (identifiers.length === 1 && identifiers[0]) {
      return identifiers[0].name;
    }
    return undefined;
  });
}
function getSecondaryLocations(functionDeclaration) {
  if (
    (functionDeclaration === null || functionDeclaration === void 0
      ? void 0
      : functionDeclaration.params) &&
    functionDeclaration.params.length > 0
  ) {
    var _a = getParametersClauseLocation(functionDeclaration.params),
      start = _a.start,
      end = _a.end;
    return [
      {
        message: 'Formal parameters',
        line: start.line,
        column: start.column,
        endLine: end.line,
        endColumn: end.column,
      },
    ];
  }
  return [];
}
function getParametersClauseLocation(parameters) {
  var firstParam = parameters[0];
  var lastParam = parameters[parameters.length - 1];
  return { start: firstParam.loc.start, end: lastParam.loc.end };
}
function normalizeType(typeAsString) {
  switch (typeAsString) {
    case 'String':
      return 'string';
    case 'Boolean':
      return 'boolean';
    case 'Number':
      return 'number';
    default:
      return typeAsString;
  }
}
