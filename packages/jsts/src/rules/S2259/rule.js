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
// https://sonarsource.github.io/rspec/#/rspec/S22259/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
var equivalence_1 = require('eslint-plugin-sonarjs/lib/utils/equivalence');
var Null;
(function (Null) {
  Null[(Null['confirmed'] = 0)] = 'confirmed';
  Null[(Null['discarded'] = 1)] = 'discarded';
  Null[(Null['unknown'] = 2)] = 'unknown';
})(Null || (Null = {}));
function isNull(n) {
  return (0, helpers_1.isNullLiteral)(n) || (0, helpers_1.isUndefined)(n);
}
var equalOperators = ['==', '==='];
var notEqualOperators = ['!=', '!=='];
exports.rule = {
  meta: {
    messages: {
      nullDereference: 'TypeError can be thrown as "{{symbol}}" might be null or undefined here.',
      shortCircuitError: 'TypeError can be thrown as expression might be null or undefined here.',
    },
  },
  create: function (context) {
    if (!(0, helpers_1.isRequiredParserServices)(context.sourceCode.parserServices)) {
      return {};
    }
    var alreadyRaisedSymbols = new Set();
    return {
      MemberExpression: function (node) {
        var _a = node,
          object = _a.object,
          optional = _a.optional;
        if (!optional) {
          checkNullDereference(object, context, alreadyRaisedSymbols);
        }
      },
      'LogicalExpression MemberExpression': function (node) {
        var _a = node,
          object = _a.object,
          optional = _a.optional;
        if (!optional) {
          var ancestors = context.getAncestors();
          var enclosingLogicalExpression = ancestors.find(function (n) {
            return n.type === 'LogicalExpression';
          });
          checkLogicalNullDereference(enclosingLogicalExpression, object, context);
        }
      },
      ForOfStatement: function (node) {
        var right = node.right;
        checkNullDereference(right, context, alreadyRaisedSymbols);
      },
      'Program:exit': function () {
        alreadyRaisedSymbols.clear();
      },
    };
  },
};
function getNullState(expr, node, context) {
  var left = expr.left,
    right = expr.right;
  if (
    (isNull(right) && (0, equivalence_1.areEquivalent)(left, node, context.getSourceCode())) ||
    (isNull(left) && (0, equivalence_1.areEquivalent)(right, node, context.getSourceCode()))
  ) {
    if (notEqualOperators.includes(expr.operator)) {
      return Null.discarded;
    }
    if (equalOperators.includes(expr.operator)) {
      return Null.confirmed;
    }
  }
  return Null.unknown;
}
function checkLogicalNullDereference(expr, node, context) {
  if (expr.left.type === 'BinaryExpression') {
    var nullState = getNullState(expr.left, node, context);
    if (
      (nullState === Null.confirmed && expr.operator === '&&') ||
      (nullState === Null.discarded && expr.operator === '||')
    ) {
      context.report({
        messageId: 'shortCircuitError',
        node: node,
      });
    }
  }
}
function isWrittenInInnerFunction(symbol, fn) {
  return symbol.references.some(function (ref) {
    if (ref.isWrite() && ref.identifier.hasOwnProperty('parent')) {
      var enclosingFn = (0, helpers_1.findFirstMatchingAncestor)(ref.identifier, function (node) {
        return helpers_1.functionLike.has(node.type);
      });
      return enclosingFn && enclosingFn !== fn;
    }
    return false;
  });
}
function checkNullDereference(node, context, alreadyRaisedSymbols) {
  var _a;
  if (node.type !== 'Identifier') {
    return;
  }
  var scope = context.getScope();
  var symbol =
    (_a = scope.references.find(function (v) {
      return v.identifier === node;
    })) === null || _a === void 0
      ? void 0
      : _a.resolved;
  if (!symbol) {
    return;
  }
  var enclosingFunction = context.getAncestors().find(function (n) {
    return helpers_1.functionLike.has(n.type);
  });
  if (
    !alreadyRaisedSymbols.has(symbol) &&
    !isWrittenInInnerFunction(symbol, enclosingFunction) &&
    (0, helpers_1.isUndefinedOrNull)(node, context.sourceCode.parserServices)
  ) {
    alreadyRaisedSymbols.add(symbol);
    context.report({
      messageId: 'nullDereference',
      data: {
        symbol: node.name,
      },
      node: node,
    });
  }
}
