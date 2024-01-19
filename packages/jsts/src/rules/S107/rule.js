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
// https://sonarsource.github.io/rspec/#/rspec/S107/javascript
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
var _a;
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var core_1 = require('../core');
var helpers_1 = require('../helpers');
var eslintMaxParams = core_1.eslintRules['max-params'];
exports.rule = {
  meta: {
    messages: __assign(
      {},
      (_a = eslintMaxParams.meta) === null || _a === void 0 ? void 0 : _a.messages,
    ),
  },
  create: function (context) {
    /**
     * Decorates ESLint `max-params` to ignore TypeScript constructor when its parameters
     * are all parameter properties, e.g., `constructor(private a: any, public b: any) {}`.
     */
    var ruleDecoration = (0, helpers_1.interceptReport)(
      eslintMaxParams,
      function (context, descriptor) {
        var maxParams = context.options[0];
        if ('node' in descriptor) {
          var functionLike = descriptor.node;
          if (!isException(functionLike)) {
            context.report(descriptor);
          }
        }
        function isException(functionLike) {
          return isBeyondMaxParams(functionLike) || isAngularConstructor(functionLike);
        }
        function isBeyondMaxParams(functionLike) {
          return (
            functionLike.params.filter(function (p) {
              return p.type !== 'TSParameterProperty';
            }).length <= maxParams
          );
        }
        function isAngularConstructor(functionLike) {
          var _a;
          /** A constructor is represented as MethodDefinition > FunctionExpression */
          var maybeConstructor = functionLike.parent;
          if (!isConstructor(maybeConstructor)) {
            return false;
          }
          /** A component is represented as ClassDeclaration > ClassBody */
          var maybeComponent =
            (_a = maybeConstructor.parent) === null || _a === void 0 ? void 0 : _a.parent;
          if (!isAngularComponent(maybeComponent)) {
            return false;
          }
          return true;
          function isConstructor(node) {
            return (
              (node === null || node === void 0 ? void 0 : node.type) === 'MethodDefinition' &&
              (0, helpers_1.isIdentifier)(node.key, 'constructor')
            );
          }
          function isAngularComponent(node) {
            var _a;
            return (
              (node === null || node === void 0 ? void 0 : node.type) === 'ClassDeclaration' &&
              ((_a = node.decorators) === null || _a === void 0
                ? void 0
                : _a.some(function (decorator) {
                    var node = decorator.expression;
                    return (
                      (0, helpers_1.isFunctionCall)(node) &&
                      (0, helpers_1.getFullyQualifiedName)(context, node.callee) ===
                        '@angular.core.Component'
                    );
                  }))
            );
          }
        }
      },
    );
    /**
     * Extends ESLint `max-params` to detect TypeScript function
     * declarations, e.g., `function f(p: any): any;`.
     */
    var ruleExtension = {
      meta: {
        messages: __assign({}, ruleDecoration.meta.messages),
      },
      create: function (context) {
        return {
          TSDeclareFunction: checkFunction,
          TSEmptyBodyFunctionExpression: checkFunction,
        };
        function checkFunction(node) {
          var functionLike = node;
          var maxParams = context.options[0];
          var numParams = functionLike.params.length;
          if (numParams > maxParams) {
            context.report({
              messageId: 'exceed',
              loc: getFunctionHeaderLocation(functionLike),
              data: {
                name: getFunctionNameWithKind(functionLike),
                count: numParams.toString(),
                max: maxParams.toString(),
              },
            });
          }
          function getFunctionHeaderLocation(functionLike) {
            var sourceCode = context.sourceCode;
            var functionNode =
              functionLike.type === 'TSEmptyBodyFunctionExpression'
                ? functionLike.parent
                : functionLike;
            var headerStart = sourceCode.getFirstToken(functionNode);
            var headerEnd = sourceCode.getFirstToken(functionNode, function (token) {
              return token.value === '(';
            });
            return {
              start: headerStart.loc.start,
              end: headerEnd.loc.start,
            };
          }
          function getFunctionNameWithKind(functionLike) {
            var name;
            var kind = 'function';
            switch (functionLike.type) {
              case 'TSDeclareFunction':
                kind = 'Function declaration';
                if (functionLike.id) {
                  name = functionLike.id.name;
                }
                break;
              case 'TSEmptyBodyFunctionExpression': {
                kind = 'Empty function';
                var parent_1 = functionLike.parent;
                if (
                  (parent_1 === null || parent_1 === void 0 ? void 0 : parent_1.type) ===
                    'MethodDefinition' &&
                  parent_1.key.type === 'Identifier'
                ) {
                  name = parent_1.key.name;
                }
                break;
              }
            }
            if (name) {
              return ''.concat(kind, " '").concat(name, "'");
            } else {
              return kind;
            }
          }
        }
      },
    };
    var decorationListeners = ruleDecoration.create(context);
    var extensionListeners = ruleExtension.create(context);
    return (0, helpers_1.mergeRules)(decorationListeners, extensionListeners);
  },
};
