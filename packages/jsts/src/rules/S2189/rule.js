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
// https://sonarsource.github.io/rspec/#/rspec/S2189/javascript
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
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var core_1 = require('../core');
var linter_1 = require('../../linter');
var helpers_1 = require('../helpers');
var noUnmodifiedLoopEslint = core_1.eslintRules['no-unmodified-loop-condition'];
exports.rule = {
  meta: {
    messages: __assign({}, noUnmodifiedLoopEslint.meta.messages),
  },
  create: function (context) {
    /**
     * Decorates ESLint `no-unmodified-loop-condition` to raise one issue per symbol.
     */
    var alreadyRaisedSymbols = new Set();
    var ruleDecoration = (0, helpers_1.interceptReport)(
      noUnmodifiedLoopEslint,
      function (context, descriptor) {
        var _a, _b, _c, _d, _e;
        var node = descriptor.node;
        var symbol =
          (_a = context.getScope().references.find(function (v) {
            return v.identifier === node;
          })) === null || _a === void 0
            ? void 0
            : _a.resolved;
        /** Ignoring symbols that have already been reported */
        if ((0, helpers_1.isUndefined)(node) || (symbol && alreadyRaisedSymbols.has(symbol))) {
          return;
        }
        /** Ignoring symbols called on or passed as arguments */
        for (
          var _i = 0,
            _f =
              (_b = symbol === null || symbol === void 0 ? void 0 : symbol.references) !== null &&
              _b !== void 0
                ? _b
                : [];
          _i < _f.length;
          _i++
        ) {
          var reference = _f[_i];
          var id = reference.identifier;
          if (
            ((_c = id.parent) === null || _c === void 0 ? void 0 : _c.type) === 'CallExpression' &&
            id.parent.arguments.includes(id)
          ) {
            return;
          }
          if (
            ((_d = id.parent) === null || _d === void 0 ? void 0 : _d.type) ===
              'MemberExpression' &&
            ((_e = id.parent.parent) === null || _e === void 0 ? void 0 : _e.type) ===
              'CallExpression' &&
            id.parent.object === id
          ) {
            return;
          }
        }
        if (symbol) {
          alreadyRaisedSymbols.add(symbol);
        }
        context.report(descriptor);
      },
    );
    /**
     * Extends ESLint `no-unmodified-loop-condition` to consider more corner cases.
     */
    var MESSAGE = "Correct this loop's end condition to not be invariant.";
    var ruleExtension = {
      create: function (context) {
        return {
          WhileStatement: checkWhileStatement,
          DoWhileStatement: checkWhileStatement,
          ForStatement: function (node) {
            var _a = node,
              test = _a.test,
              body = _a.body;
            if (!test || (test.type === 'Literal' && test.value === true)) {
              var hasEndCondition = LoopVisitor.hasEndCondition(body, context);
              if (!hasEndCondition) {
                var firstToken = context.sourceCode.getFirstToken(node);
                context.report({
                  loc: firstToken.loc,
                  message: MESSAGE,
                });
              }
            }
          },
        };
        function checkWhileStatement(node) {
          var whileStatement = node;
          if (whileStatement.test.type === 'Literal' && whileStatement.test.value === true) {
            var hasEndCondition = LoopVisitor.hasEndCondition(whileStatement.body, context);
            if (!hasEndCondition) {
              var firstToken = context.sourceCode.getFirstToken(node);
              context.report({ loc: firstToken.loc, message: MESSAGE });
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
var LoopVisitor = /** @class */ (function () {
  function LoopVisitor() {
    this.hasEndCondition = false;
  }
  LoopVisitor.hasEndCondition = function (node, context) {
    var visitor = new LoopVisitor();
    visitor.visit(node, context);
    return visitor.hasEndCondition;
  };
  LoopVisitor.prototype.visit = function (root, context) {
    var _this = this;
    var visitNode = function (node, isNestedLoop) {
      if (isNestedLoop === void 0) {
        isNestedLoop = false;
      }
      switch (node.type) {
        case 'WhileStatement':
        case 'DoWhileStatement':
        case 'ForStatement':
          isNestedLoop = true;
          break;
        case 'FunctionExpression':
        case 'FunctionDeclaration':
          // Don't consider nested functions
          return;
        case 'BreakStatement':
          if (!isNestedLoop || !!node.label) {
            _this.hasEndCondition = true;
          }
          break;
        case 'YieldExpression':
        case 'ReturnStatement':
        case 'ThrowStatement':
          _this.hasEndCondition = true;
          return;
      }
      (0, linter_1.childrenOf)(node, context.sourceCode.visitorKeys).forEach(function (child) {
        return visitNode(child, isNestedLoop);
      });
    };
    visitNode(root);
  };
  return LoopVisitor;
})();
