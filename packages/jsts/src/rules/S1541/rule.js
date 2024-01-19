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
// https://sonarsource.github.io/rspec/#/rspec/S1541/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var locations_1 = require('eslint-plugin-sonarjs/lib/utils/locations');
var helpers_1 = require('../helpers');
var parameters_1 = require('../../linter/parameters');
var linter_1 = require('../../linter');
exports.rule = {
  meta: {
    schema: [
      { type: 'integer' },
      {
        // internal parameter for rules having secondary locations
        enum: [parameters_1.SONAR_RUNTIME],
      },
    ],
  },
  create: function (context) {
    var threshold = context.options[0];
    var functionsWithParent;
    var functionsDefiningModule;
    var functionsImmediatelyInvoked;
    return {
      Program: function () {
        functionsWithParent = new Map();
        functionsDefiningModule = [];
        functionsImmediatelyInvoked = [];
      },
      'Program:exit': function () {
        functionsWithParent.forEach(function (parent, func) {
          if (
            !functionsDefiningModule.includes(func) &&
            !functionsImmediatelyInvoked.includes(func)
          ) {
            raiseOnUnauthorizedComplexity(func, parent, threshold, context);
          }
        });
      },
      'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression': function (node) {
        return functionsWithParent.set(node, (0, helpers_1.getParent)(context));
      },
      "CallExpression[callee.type='Identifier'][callee.name='define'] FunctionExpression":
        function (node) {
          return functionsDefiningModule.push(node);
        },
      "NewExpression[callee.type='FunctionExpression'], CallExpression[callee.type='FunctionExpression']":
        function (node) {
          return functionsImmediatelyInvoked.push(node.callee);
        },
    };
  },
};
function raiseOnUnauthorizedComplexity(node, parent, threshold, context) {
  var tokens = computeCyclomaticComplexity(node, parent, context);
  var complexity = tokens.length;
  if (complexity > threshold) {
    context.report({
      message: toEncodedMessage(complexity, threshold, tokens),
      loc: (0, locations_1.getMainFunctionTokenLocation)(node, parent, context),
    });
  }
}
function toEncodedMessage(complexity, threshold, tokens) {
  var encodedMessage = {
    message: 'Function has a complexity of '
      .concat(complexity, ' which is greater than ')
      .concat(threshold, ' authorized.'),
    cost: complexity - threshold,
    secondaryLocations: tokens.map(toSecondaryLocation),
  };
  return JSON.stringify(encodedMessage);
}
function toSecondaryLocation(token) {
  return {
    line: token.loc.start.line,
    column: token.loc.start.column,
    endLine: token.loc.end.line,
    endColumn: token.loc.end.column,
    message: '+1',
  };
}
function computeCyclomaticComplexity(node, parent, context) {
  var visitor = new FunctionComplexityVisitor(node, parent, context);
  visitor.visit();
  return visitor.getComplexityTokens();
}
var FunctionComplexityVisitor = /** @class */ (function () {
  function FunctionComplexityVisitor(root, parent, context) {
    this.root = root;
    this.parent = parent;
    this.context = context;
    this.tokens = [];
  }
  FunctionComplexityVisitor.prototype.visit = function () {
    var _this = this;
    var visitNode = function (node) {
      var sourceCode = _this.context.sourceCode;
      var token;
      if ((0, helpers_1.isFunctionNode)(node)) {
        if (node !== _this.root) {
          return;
        } else {
          token = {
            loc: (0, locations_1.getMainFunctionTokenLocation)(node, _this.parent, _this.context),
          };
        }
      } else {
        switch (node.type) {
          case 'ConditionalExpression':
            token = sourceCode.getFirstTokenBetween(node.test, node.consequent, function (token) {
              return token.value === '?';
            });
            break;
          case 'SwitchCase':
            // ignore default case
            if (!node.test) {
              break;
            }
          case 'IfStatement':
          case 'ForStatement':
          case 'ForInStatement':
          case 'ForOfStatement':
          case 'WhileStatement':
          case 'DoWhileStatement':
            token = sourceCode.getFirstToken(node);
            break;
          case 'LogicalExpression':
            token = sourceCode.getTokenAfter(node.left, function (token) {
              return ['||', '&&'].includes(token.value) && token.type === 'Punctuator';
            });
            break;
        }
      }
      if (token) {
        _this.tokens.push(token);
      }
      (0, linter_1.childrenOf)(node, sourceCode.visitorKeys).forEach(visitNode);
    };
    visitNode(this.root);
  };
  FunctionComplexityVisitor.prototype.getComplexityTokens = function () {
    return this.tokens;
  };
  return FunctionComplexityVisitor;
})();
