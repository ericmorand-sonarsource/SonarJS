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
// https://sonarsource.github.io/rspec/#/rspec/S4822/javascript
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
    if ((0, helpers_1.isRequiredParserServices)(services)) {
      return {
        TryStatement: function (node) {
          return visitTryStatement(node, context, services);
        },
      };
    }
    return {};
  },
};
function visitTryStatement(tryStmt, context, services) {
  if (tryStmt.handler) {
    // without '.catch()'
    var openPromises_1 = [];
    // with '.catch()'
    var capturedPromises_1 = [];
    var hasPotentiallyThrowingCalls_1 = false;
    CallLikeExpressionVisitor.getCallExpressions(tryStmt.block, context).forEach(function (
      callLikeExpr,
    ) {
      if (
        callLikeExpr.type === 'AwaitExpression' ||
        !(0, helpers_1.isThenable)(callLikeExpr, services)
      ) {
        hasPotentiallyThrowingCalls_1 = true;
        return;
      }
      if (isAwaitLike(callLikeExpr) || isThened(callLikeExpr) || isCatch(callLikeExpr)) {
        return;
      }
      (isCaught(callLikeExpr) ? capturedPromises_1 : openPromises_1).push(callLikeExpr);
    });
    if (!hasPotentiallyThrowingCalls_1) {
      checkForWrongCatch(tryStmt, openPromises_1, context);
      checkForUselessCatch(tryStmt, openPromises_1, capturedPromises_1, context);
    }
  }
}
var CallLikeExpressionVisitor = /** @class */ (function () {
  function CallLikeExpressionVisitor() {
    this.callLikeExpressions = [];
  }
  CallLikeExpressionVisitor.getCallExpressions = function (node, context) {
    var visitor = new CallLikeExpressionVisitor();
    visitor.visit(node, context);
    return visitor.callLikeExpressions;
  };
  CallLikeExpressionVisitor.prototype.visit = function (root, context) {
    var _this = this;
    var visitNode = function (node) {
      switch (node.type) {
        case 'AwaitExpression':
        case 'CallExpression':
        case 'NewExpression':
          _this.callLikeExpressions.push(node);
          break;
        case 'FunctionDeclaration':
        case 'FunctionExpression':
        case 'ArrowFunctionExpression':
          return;
      }
      childrenOf(node, context.sourceCode.visitorKeys).forEach(visitNode);
    };
    visitNode(root);
  };
  return CallLikeExpressionVisitor;
})();
function checkForWrongCatch(tryStmt, openPromises, context) {
  if (openPromises.length > 0) {
    var ending = openPromises.length > 1 ? 's' : '';
    var message = "Consider using 'await' for the promise"
      .concat(ending, " inside this 'try' or replace it with 'Promise.prototype.catch(...)' usage")
      .concat(ending, '.');
    var token = context.sourceCode.getFirstToken(tryStmt);
    context.report({
      message: (0, helpers_1.toEncodedMessage)(
        message,
        openPromises,
        Array(openPromises.length).fill('Promise'),
      ),
      loc: token.loc,
    });
  }
}
function checkForUselessCatch(tryStmt, openPromises, capturedPromises, context) {
  if (openPromises.length === 0 && capturedPromises.length > 0) {
    var ending = capturedPromises.length > 1 ? 's' : '';
    var message = "Consider removing this 'try' statement as promise".concat(
      ending,
      " rejection is already captured by '.catch()' method.",
    );
    var token = context.sourceCode.getFirstToken(tryStmt);
    context.report({
      message: (0, helpers_1.toEncodedMessage)(
        message,
        capturedPromises,
        Array(capturedPromises.length).fill('Caught promise'),
      ),
      loc: token.loc,
    });
  }
}
function isAwaitLike(callExpr) {
  return (
    callExpr.parent &&
    (callExpr.parent.type === 'AwaitExpression' || callExpr.parent.type === 'YieldExpression')
  );
}
function isThened(callExpr) {
  return (
    callExpr.parent &&
    callExpr.parent.type === 'MemberExpression' &&
    callExpr.parent.property.type === 'Identifier' &&
    callExpr.parent.property.name === 'then'
  );
}
function isCaught(callExpr) {
  return (
    callExpr.parent &&
    callExpr.parent.type === 'MemberExpression' &&
    callExpr.parent.property.type === 'Identifier' &&
    callExpr.parent.property.name === 'catch'
  );
}
function isCatch(callExpr) {
  return (
    callExpr.type === 'CallExpression' &&
    callExpr.callee.type === 'MemberExpression' &&
    callExpr.callee.property.type === 'Identifier' &&
    callExpr.callee.property.name === 'catch'
  );
}
function childrenOf(node, visitorKeys) {
  var keys = visitorKeys[node.type];
  var children = [];
  if (keys) {
    for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
      var key = keys_1[_i];
      var child = node[key];
      if (Array.isArray(child)) {
        children.push.apply(children, child);
      } else {
        children.push(child);
      }
    }
  }
  return children.filter(Boolean);
}
