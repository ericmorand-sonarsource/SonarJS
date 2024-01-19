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
// https://sonarsource.github.io/rspec/#/rspec/S1226/javascript
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
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
exports.rule = {
  meta: {
    messages: {
      noReassignment:
        'Introduce a new variable or use its initial value before reassigning "{{reference}}".',
    },
  },
  create: function (context) {
    var variableUsageContext = {
      type: 'global',
      variablesToCheckInCurrentScope: new Set(),
      variablesToCheck: new Set(),
      variablesRead: new Set(),
      referencesByIdentifier: new Map(),
    };
    function checkIdentifierUsage(identifier, identifierContextType) {
      if (variableUsageContext.type !== identifierContextType) {
        return;
      }
      var variableName = identifier.name;
      var currentReference = getReference(variableUsageContext, identifier);
      if (
        currentReference &&
        !currentReference.init &&
        !variableUsageContext.variablesRead.has(variableName)
      ) {
        if (
          variableUsageContext.variablesToCheck.has(variableName) &&
          currentReference.isWriteOnly() &&
          !isUsedInWriteExpression(variableName, currentReference.writeExpr)
        ) {
          // we do not raise issue when value is reassigned inside a top-level IfStatement, as it might be a shift or
          // default value reassignment
          if (
            isInsideIfStatement(context) ||
            context.getAncestors().some(function (node) {
              return node.type === 'SwitchCase';
            }) // issue-2398
          ) {
            return;
          }
          raiseIssue(currentReference);
        }
        markAsRead(variableUsageContext, variableName);
      } else if (variableName === 'arguments') {
        markAllFunctionArgumentsAsRead(variableUsageContext);
      }
    }
    function isUsedInWriteExpression(variableName, writeExpr) {
      return (
        writeExpr &&
        context.sourceCode.getFirstToken(writeExpr, function (token) {
          return token.value === variableName || token.value === 'arguments';
        })
      );
    }
    function raiseIssue(reference) {
      var locationHolder = getPreciseLocationHolder(reference);
      context.report(
        __assign(
          {
            messageId: 'noReassignment',
            data: {
              reference: reference.identifier.name,
            },
          },
          locationHolder,
        ),
      );
    }
    function popContext() {
      variableUsageContext = variableUsageContext.parentContext
        ? variableUsageContext.parentContext
        : variableUsageContext;
    }
    return {
      onCodePathStart: function (_codePath, node) {
        var currentScope = context.getScope();
        if (currentScope && currentScope.type === 'function') {
          var _a = computeNewContextInfo(variableUsageContext, context, node),
            referencesByIdentifier = _a.referencesByIdentifier,
            variablesToCheck = _a.variablesToCheck,
            variablesToCheckInCurrentScope = _a.variablesToCheckInCurrentScope;
          var functionName = getFunctionName(node);
          if (functionName) {
            variablesToCheck.delete(functionName);
          }
          variableUsageContext = {
            type: 'function',
            parentContext: variableUsageContext,
            variablesToCheck: variablesToCheck,
            referencesByIdentifier: referencesByIdentifier,
            variablesToCheckInCurrentScope: variablesToCheckInCurrentScope,
            variablesRead: computeSetDifference(
              variableUsageContext.variablesRead,
              variablesToCheckInCurrentScope,
            ),
          };
        } else {
          variableUsageContext = {
            type: 'global',
            parentContext: variableUsageContext,
            variablesToCheckInCurrentScope: new Set(),
            variablesToCheck: new Set(),
            variablesRead: new Set(),
            referencesByIdentifier: new Map(),
          };
        }
      },
      onCodePathSegmentLoop: function (_fromSegment, _toSegment, node) {
        var parent = (0, helpers_1.getParent)(context);
        if (!isForEachLoopStart(node, parent)) {
          return;
        }
        var currentScope = context.sourceCode.scopeManager.acquire(parent.body);
        var _a = computeNewContextInfo(variableUsageContext, context, parent.left),
          referencesByIdentifier = _a.referencesByIdentifier,
          variablesToCheck = _a.variablesToCheck,
          variablesToCheckInCurrentScope = _a.variablesToCheckInCurrentScope;
        if (currentScope) {
          for (var _i = 0, _b = currentScope.references; _i < _b.length; _i++) {
            var ref = _b[_i];
            referencesByIdentifier.set(ref.identifier, ref);
          }
        }
        // In case of array or object pattern expression, the left hand side are not declared variables but simply identifiers
        (0, helpers_1.resolveIdentifiers)(parent.left, true)
          .map(function (identifier) {
            return identifier.name;
          })
          .forEach(function (name) {
            variablesToCheck.add(name);
            variablesToCheckInCurrentScope.add(name);
          });
        variableUsageContext = {
          type: 'foreach',
          parentContext: variableUsageContext,
          variablesToCheckInCurrentScope: variablesToCheckInCurrentScope,
          variablesToCheck: variablesToCheck,
          variablesRead: computeSetDifference(
            variableUsageContext.variablesRead,
            variablesToCheckInCurrentScope,
          ),
          referencesByIdentifier: referencesByIdentifier,
        };
      },
      onCodePathSegmentStart: function (_segment, node) {
        if (node.type !== 'CatchClause') {
          return;
        }
        var _a = computeNewContextInfo(variableUsageContext, context, node),
          referencesByIdentifier = _a.referencesByIdentifier,
          variablesToCheck = _a.variablesToCheck,
          variablesToCheckInCurrentScope = _a.variablesToCheckInCurrentScope;
        variableUsageContext = {
          type: 'catch',
          parentContext: variableUsageContext,
          variablesToCheckInCurrentScope: variablesToCheckInCurrentScope,
          variablesToCheck: variablesToCheck,
          variablesRead: computeSetDifference(
            variableUsageContext.variablesRead,
            variablesToCheckInCurrentScope,
          ),
          referencesByIdentifier: referencesByIdentifier,
        };
      },
      onCodePathEnd: popContext,
      'ForInStatement:exit': popContext,
      'ForOfStatement:exit': popContext,
      'CatchClause:exit': popContext,
      '*:function > BlockStatement Identifier': function (node) {
        return checkIdentifierUsage(node, 'function');
      },
      'ForInStatement > *:statement Identifier': function (node) {
        return checkIdentifierUsage(node, 'foreach');
      },
      'ForOfStatement > *:statement Identifier': function (node) {
        return checkIdentifierUsage(node, 'foreach');
      },
      'CatchClause > BlockStatement Identifier': function (node) {
        return checkIdentifierUsage(node, 'catch');
      },
    };
  },
};
function isInsideIfStatement(context) {
  var ancestors = context.getAncestors();
  for (var i = ancestors.length - 1; i >= 0; i--) {
    if (
      ancestors[i].type === 'IfStatement' &&
      // We check if the consequent or the alternate are also ancestors
      // Nodes in the test attribute should be raised
      i < ancestors.length - 1 &&
      (ancestors[i + 1] === ancestors[i].consequent || ancestors[i + 1] === ancestors[i].alternate)
    ) {
      return true;
    }
  }
  return false;
}
/**
 * Computes the set difference (a \ b)
 */
function computeSetDifference(a, b) {
  return new Set(
    __spreadArray([], a, true).filter(function (str) {
      return !b.has(str);
    }),
  );
}
function getFunctionName(node) {
  return !node.id ? null : node.id.name;
}
function isForEachLoopStart(node, parent) {
  return (
    node.type === 'BlockStatement' &&
    !!parent &&
    (parent.type === 'ForInStatement' || parent.type === 'ForOfStatement')
  );
}
function computeNewContextInfo(variableUsageContext, context, node) {
  var referencesByIdentifier = new Map();
  var variablesToCheck = new Set(variableUsageContext.variablesToCheck);
  var variablesToCheckInCurrentScope = new Set();
  context.getDeclaredVariables(node).forEach(function (variable) {
    variablesToCheck.add(variable.name);
    variablesToCheckInCurrentScope.add(variable.name);
    for (var _i = 0, _a = variable.references; _i < _a.length; _i++) {
      var currentRef = _a[_i];
      referencesByIdentifier.set(currentRef.identifier, currentRef);
    }
  });
  return {
    referencesByIdentifier: referencesByIdentifier,
    variablesToCheck: variablesToCheck,
    variablesToCheckInCurrentScope: variablesToCheckInCurrentScope,
  };
}
function markAsRead(context, variableName) {
  context.variablesRead.add(variableName);
  if (!context.variablesToCheckInCurrentScope.has(variableName) && context.parentContext) {
    markAsRead(context.parentContext, variableName);
  }
}
function markAllFunctionArgumentsAsRead(variableUsageContext) {
  var functionContext = variableUsageContext;
  while (functionContext && functionContext.type !== 'function') {
    functionContext = functionContext.parentContext;
  }
  if (functionContext) {
    for (var _i = 0, _a = functionContext.variablesToCheckInCurrentScope; _i < _a.length; _i++) {
      var variableName = _a[_i];
      functionContext.variablesRead.add(variableName);
    }
  }
}
function getPreciseLocationHolder(reference) {
  var identifierLoc = reference.identifier.loc;
  if (identifierLoc && reference.writeExpr && reference.writeExpr.loc) {
    return { loc: { start: identifierLoc.start, end: reference.writeExpr.loc.end } };
  }
  return { node: reference.identifier };
}
function getReference(variableUsageContext, identifier) {
  var identifierReference = variableUsageContext.referencesByIdentifier.get(identifier);
  if (!identifierReference && variableUsageContext.parentContext) {
    return getReference(variableUsageContext.parentContext, identifier);
  }
  return identifierReference;
}
