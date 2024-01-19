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
// https://sonarsource.github.io/rspec/#/rspec/S2137/javascript
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
var helpers_1 = require('../helpers');
var illegalNames = ['arguments'];
var objectPrototypeProperties = [
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf',
];
var deprecatedNames = ['escape', 'unescape'];
var getDeclarationIssue = function (redeclareType) {
  return function (name) {
    return {
      messageId: 'forbidDeclaration',
      data: { symbol: name, type: redeclareType },
    };
  };
};
var getModificationIssue = function (functionName) {
  return {
    messageId: 'removeModification',
    data: { symbol: functionName },
  };
};
exports.rule = {
  meta: {
    messages: {
      removeModification: 'Remove the modification of "{{symbol}}".',
      forbidDeclaration: 'Do not use "{{symbol}}" to declare a {{type}} - use another name.',
    },
  },
  create: function (context) {
    return {
      'FunctionDeclaration, FunctionExpression': function (node) {
        var func = node;
        reportBadUsageOnFunction(func, func.id, context);
      },
      ArrowFunctionExpression: function (node) {
        reportBadUsageOnFunction(node, undefined, context);
      },
      VariableDeclaration: function (node) {
        node.declarations.forEach(function (decl) {
          reportGlobalShadowing(
            decl.id,
            getDeclarationIssue('variable'),
            context,
            decl.init != null,
          );
        });
      },
      UpdateExpression: function (node) {
        reportGlobalShadowing(node.argument, getModificationIssue, context, true);
      },
      AssignmentExpression: function (node) {
        reportGlobalShadowing(node.left, getModificationIssue, context, true);
      },
      CatchClause: function (node) {
        reportGlobalShadowing(node.param, getDeclarationIssue('variable'), context, true);
      },
    };
  },
};
function reportBadUsageOnFunction(func, id, context) {
  reportGlobalShadowing(id, getDeclarationIssue('function'), context, true);
  func.params.forEach(function (p) {
    reportGlobalShadowing(p, getDeclarationIssue('parameter'), context, false);
  });
}
function reportGlobalShadowing(node, buildMessageAndData, context, isWrite) {
  if (node) {
    switch (node.type) {
      case 'Identifier': {
        if (isGlobalShadowing(node.name, isWrite) && !isShadowingException(node.name)) {
          context.report(__assign({ node: node }, buildMessageAndData(node.name)));
        }
        break;
      }
      case 'RestElement':
        reportGlobalShadowing(node.argument, buildMessageAndData, context, true);
        break;
      case 'ObjectPattern':
        node.properties.forEach(function (prop) {
          if (prop.type === 'Property') {
            reportGlobalShadowing(prop.value, buildMessageAndData, context, true);
          } else {
            reportGlobalShadowing(prop.argument, buildMessageAndData, context, true);
          }
        });
        break;
      case 'ArrayPattern':
        node.elements.forEach(function (elem) {
          reportGlobalShadowing(elem, buildMessageAndData, context, true);
        });
        break;
      case 'AssignmentPattern':
        reportGlobalShadowing(node.left, buildMessageAndData, context, true);
        break;
    }
  }
}
function isGlobalShadowing(name, isWrite) {
  return isIllegalName(name) || isBuiltInName(name) || isUndefinedShadowing(isWrite, name);
}
function isIllegalName(name) {
  return illegalNames.includes(name);
}
function isBuiltInName(name) {
  return helpers_1.globalsByLibraries.builtin.includes(name);
}
function isUndefinedShadowing(isWrite, name) {
  return isWrite && name === 'undefined';
}
function isShadowingException(name) {
  return isObjectPrototypeProperty(name) || isDeprecatedName(name);
}
function isObjectPrototypeProperty(name) {
  return objectPrototypeProperties.includes(name);
}
function isDeprecatedName(name) {
  return deprecatedNames.includes(name);
}
