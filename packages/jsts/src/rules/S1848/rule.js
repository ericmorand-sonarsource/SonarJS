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
// https://sonarsource.github.io/rspec/#/rspec/S1848/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
exports.rule = {
  meta: {
    messages: {
      removeInstantiationOf:
        'Either remove this useless object instantiation of "{{constructor}}" or use it.',
      removeInstantiation: 'Either remove this useless object instantiation or use it.',
    },
  },
  create: function (context) {
    var sourceCode = context.sourceCode;
    return {
      'ExpressionStatement > NewExpression': function (node) {
        if ((0, helpers_1.isTestCode)(context) || isTryable(node, context)) {
          return;
        }
        var callee = node.callee;
        if (callee.type === 'Identifier' || callee.type === 'MemberExpression') {
          var calleeText = sourceCode.getText(callee);
          if (isException(context, callee, calleeText)) {
            return;
          }
          var reportLocation = {
            start: node.loc.start,
            end: callee.loc.end,
          };
          reportIssue(reportLocation, ''.concat(calleeText), 'removeInstantiationOf', context);
        } else {
          var newToken = sourceCode.getFirstToken(node);
          reportIssue(newToken.loc, '', 'removeInstantiation', context);
        }
      },
    };
  },
};
function isTryable(node, context) {
  var ancestors = context.getAncestors();
  var parent = undefined;
  var child = node;
  while ((parent = ancestors.pop()) !== undefined) {
    if (parent.type === 'TryStatement' && parent.block === child) {
      return true;
    }
    child = parent;
  }
  return false;
}
function reportIssue(loc, objectText, messageId, context) {
  context.report({
    messageId: messageId,
    data: {
      constructor: objectText,
    },
    loc: loc,
  });
}
/**
 * These exceptions are based on community requests and Peach
 */
function isException(context, node, name) {
  if (name === 'Notification') {
    return true;
  }
  var fqn = (0, helpers_1.getFullyQualifiedName)(context, node);
  return fqn === 'vue' || fqn === '@ag-grid-community.core.Grid';
}
