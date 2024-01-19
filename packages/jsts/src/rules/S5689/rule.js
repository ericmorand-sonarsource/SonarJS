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
// https://sonarsource.github.io/rspec/#/rspec/S5689/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
var HELMET = 'helmet';
var HIDE_POWERED_BY = 'hide-powered-by';
var HEADER_X_POWERED_BY = 'X-Powered-By'.toLowerCase();
var PROTECTING_MIDDLEWARES = [HELMET, HIDE_POWERED_BY];
/** Expected number of arguments in `app.set`. */
var APP_SET_NUM_ARGS = 2;
exports.rule = {
  meta: {
    messages: {
      headerSet: 'Make sure disclosing the fingerprinting of this web technology is safe here.',
      headerDefault:
        'This framework implicitly discloses version information by default. Make sure it is safe here.',
    },
  },
  create: function (context) {
    var appInstantiation = null;
    var isSafe = false;
    var isExplicitelyUnsafe = false;
    return {
      Program: function () {
        appInstantiation = null;
        isSafe = false;
        isExplicitelyUnsafe = true;
      },
      CallExpression: function (node) {
        if (!isSafe && appInstantiation) {
          var callExpr = node;
          isSafe =
            helpers_1.Express.isUsingMiddleware(
              context,
              callExpr,
              appInstantiation,
              isProtecting(context),
            ) ||
            isDisabledXPoweredBy(callExpr, appInstantiation) ||
            isSetFalseXPoweredBy(callExpr, appInstantiation) ||
            isAppEscaping(callExpr, appInstantiation);
          isExplicitelyUnsafe = isSetTrueXPoweredBy(callExpr, appInstantiation);
        }
      },
      VariableDeclarator: function (node) {
        if (!isSafe && !appInstantiation) {
          var varDecl = node;
          var app = helpers_1.Express.attemptFindAppInstantiation(varDecl, context);
          if (app) {
            appInstantiation = app;
          }
        }
      },
      ReturnStatement: function (node) {
        if (!isSafe && appInstantiation) {
          var ret = node;
          isSafe = isAppEscapingThroughReturn(ret, appInstantiation);
        }
      },
      'Program:exit': function () {
        if (!isSafe && appInstantiation) {
          var messageId = 'headerDefault';
          if (isExplicitelyUnsafe) {
            messageId = 'headerSet';
          }
          context.report({
            node: appInstantiation,
            messageId: messageId,
          });
        }
      },
    };
  },
};
/**
 * Checks whether node looks like `helmet.hidePoweredBy()`.
 */
function isHidePoweredByFromHelmet(context, n) {
  if (n.type === 'CallExpression') {
    return (0, helpers_1.getFullyQualifiedName)(context, n) === ''.concat(HELMET, '.hidePoweredBy');
  }
  return false;
}
function isProtecting(context) {
  return function (n) {
    return (
      helpers_1.Express.isMiddlewareInstance(context, PROTECTING_MIDDLEWARES, n) ||
      isHidePoweredByFromHelmet(context, n)
    );
  };
}
function isDisabledXPoweredBy(callExpression, app) {
  if ((0, helpers_1.isMethodInvocation)(callExpression, app.name, 'disable', 1)) {
    var arg0 = callExpression.arguments[0];
    return arg0.type === 'Literal' && String(arg0.value).toLowerCase() === HEADER_X_POWERED_BY;
  }
  return false;
}
function isSetFalseXPoweredBy(callExpression, app) {
  return getSetTrueXPoweredByValue(callExpression, app) === false;
}
function isSetTrueXPoweredBy(callExpression, app) {
  return getSetTrueXPoweredByValue(callExpression, app) === true;
}
function getSetTrueXPoweredByValue(callExpression, app) {
  if ((0, helpers_1.isMethodInvocation)(callExpression, app.name, 'set', APP_SET_NUM_ARGS)) {
    var _a = callExpression.arguments,
      headerName = _a[0],
      onOff = _a[1];
    if (
      headerName.type === 'Literal' &&
      String(headerName.value).toLowerCase() === HEADER_X_POWERED_BY &&
      onOff.type === 'Literal'
    ) {
      return onOff.value;
    }
  }
  return undefined;
}
function isAppEscaping(callExpr, app) {
  return Boolean(
    callExpr.arguments.find(function (arg) {
      return arg.type === 'Identifier' && arg.name === app.name;
    }),
  );
}
function isAppEscapingThroughReturn(ret, app) {
  var arg = ret.argument;
  return Boolean(arg && arg.type === 'Identifier' && arg.name === app.name);
}
