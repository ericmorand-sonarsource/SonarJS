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
// https://sonarsource.github.io/rspec/#/rspec/S4043/javascript
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod)
        if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
var ts = __importStar(require('typescript'));
var helpers_1 = require('../helpers');
var arrayMutatingMethods = __spreadArray(
  ['reverse', "'reverse'", '"reverse"'],
  helpers_1.sortLike,
  true,
);
exports.rule = {
  meta: {
    hasSuggestions: true,
    messages: {
      moveMethod:
        'Move this array "{{method}}" operation to a separate statement or replace it with "{{suggestedMethod}}".',
      suggestMethod: 'Replace with "{{suggestedMethod}}" method',
    },
  },
  create: function (context) {
    var services = context.sourceCode.parserServices;
    if (!(0, helpers_1.isRequiredParserServices)(services)) {
      return {};
    }
    return {
      CallExpression: function (node) {
        var callee = node.callee;
        if (callee.type === 'MemberExpression') {
          var propertyText_1 = context.sourceCode.getText(callee.property);
          if (isArrayMutatingCall(callee, services, propertyText_1)) {
            var mutatedArray = callee.object;
            if (
              isIdentifierOrPropertyAccessExpression(mutatedArray, services) &&
              !isInSelfAssignment(mutatedArray, node) &&
              isForbiddenOperation(node)
            ) {
              var method_1 = formatMethod(propertyText_1);
              var suggestedMethod_1 = method_1 === 'sort' ? 'toSorted' : 'toReversed';
              context.report({
                messageId: 'moveMethod',
                data: {
                  method: method_1,
                  suggestedMethod: suggestedMethod_1,
                },
                node: node,
                suggest: [
                  {
                    messageId: 'suggestMethod',
                    data: {
                      suggestedMethod: suggestedMethod_1,
                    },
                    fix: function (fixer) {
                      var fixedPropertyText = propertyText_1.replace(method_1, suggestedMethod_1);
                      return fixer.replaceText(callee.property, fixedPropertyText);
                    },
                  },
                ],
              });
            }
          }
        }
      },
    };
  },
};
function formatMethod(mutatingMethod) {
  if (mutatingMethod.startsWith('"') || mutatingMethod.startsWith("'")) {
    return mutatingMethod.substring(1, mutatingMethod.length - 1);
  } else {
    return mutatingMethod;
  }
}
function isArrayMutatingCall(memberExpression, services, propertyText) {
  return (
    arrayMutatingMethods.includes(propertyText) &&
    (0, helpers_1.isArray)(memberExpression.object, services)
  );
}
function isIdentifierOrPropertyAccessExpression(node, services) {
  return (
    node.type === 'Identifier' ||
    (node.type === 'MemberExpression' && !isGetAccessor(node.property, services))
  );
}
function isGetAccessor(node, services) {
  var symbol = (0, helpers_1.getSymbolAtLocation)(node, services);
  var declarations = symbol === null || symbol === void 0 ? void 0 : symbol.declarations;
  return (
    (declarations === null || declarations === void 0 ? void 0 : declarations.length) === 1 &&
    declarations[0].kind === ts.SyntaxKind.GetAccessor
  );
}
function isInSelfAssignment(mutatedArray, node) {
  var parent = node.parent;
  return (
    // check assignment
    parent !== undefined &&
    parent.type === 'AssignmentExpression' &&
    parent.operator === '=' &&
    parent.left.type === 'Identifier' &&
    mutatedArray.type === 'Identifier' &&
    parent.left.name === mutatedArray.name
  );
}
function isForbiddenOperation(node) {
  return !isStandaloneExpression(node) && !isReturnedExpression(node);
}
function isStandaloneExpression(node) {
  var ancestors = (0, helpers_1.localAncestorsChain)(node);
  var returnIdx = ancestors.findIndex(function (ancestor) {
    return ancestor.type === 'ExpressionStatement';
  });
  return (
    returnIdx > -1 &&
    ancestors.slice(0, returnIdx).every(function (ancestor) {
      return ['ChainExpression', 'LogicalExpression'].includes(ancestor.type);
    })
  );
}
function isReturnedExpression(node) {
  var ancestors = (0, helpers_1.localAncestorsChain)(node);
  var returnIdx = ancestors.findIndex(function (ancestor) {
    return ancestor.type === 'ReturnStatement';
  });
  return (
    returnIdx > -1 &&
    ancestors.slice(0, returnIdx).every(function (ancestor) {
      return [
        'ArrayExpression',
        'ObjectExpression',
        'ConditionalExpression',
        'SpreadElement',
      ].includes(ancestor.type);
    })
  );
}
