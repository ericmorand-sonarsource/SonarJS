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
// https://sonarsource.github.io/rspec/#/rspec/S3796/javascript
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
var locations_1 = require('eslint-plugin-sonarjs/lib/utils/locations');
var helpers_1 = require('../helpers');
var message = 'Add a "return" statement to this callback.';
var methodsWithCallback = [
  'every',
  'filter',
  'find',
  'findLast',
  'findIndex',
  'findLastIndex',
  'map',
  'flatMap',
  'reduce',
  'reduceRight',
  'some',
  'sort',
  'toSorted',
];
function hasCallBackWithoutReturn(argument, services) {
  var checker = services.program.getTypeChecker();
  var type = checker.getTypeAtLocation(services.esTreeNodeToTSNodeMap.get(argument));
  var signatures = type.getCallSignatures();
  return (
    signatures.length > 0 &&
    signatures.every(function (sig) {
      return checker.typeToString(sig.getReturnType()) === 'void';
    })
  );
}
exports.rule = {
  create: function (context) {
    var services = context.sourceCode.parserServices;
    if (!(0, helpers_1.isRequiredParserServices)(services)) {
      return {};
    }
    return {
      'CallExpression[callee.type="MemberExpression"]': function (node) {
        var callExpression = node;
        var args = callExpression.arguments;
        var memberExpression = callExpression.callee;
        var object = memberExpression.object;
        var propName = extractPropName(memberExpression);
        if (propName === null || args.length === 0) {
          return;
        }
        if (
          methodsWithCallback.includes(propName) &&
          ((0, helpers_1.isArray)(object, services) ||
            (0, helpers_1.isTypedArray)(object, services)) &&
          hasCallBackWithoutReturn(args[0], services)
        ) {
          context.report(__assign({ message: message }, getNodeToReport(args[0], node, context)));
        } else if (
          (0, helpers_1.isMemberExpression)(callExpression.callee, 'Array', 'from') &&
          args.length > 1 &&
          hasCallBackWithoutReturn(args[1], services)
        ) {
          context.report(__assign({ message: message }, getNodeToReport(args[1], node, context)));
        }
      },
    };
  },
};
function extractPropName(memberExpression) {
  if ((0, helpers_1.isDotNotation)(memberExpression)) {
    return memberExpression.property.name;
  } else if ((0, helpers_1.isIndexNotation)(memberExpression)) {
    return memberExpression.property.value;
  } else {
    return null;
  }
}
function getNodeToReport(node, parent, context) {
  if (
    node.type === 'FunctionDeclaration' ||
    node.type === 'FunctionExpression' ||
    node.type === 'ArrowFunctionExpression'
  ) {
    return {
      loc: (0, locations_1.getMainFunctionTokenLocation)(node, parent, context),
    };
  }
  return {
    node: node,
  };
}
