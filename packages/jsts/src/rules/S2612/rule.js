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
// https://sonarsource.github.io/rspec/#/rspec/S2612/javascript
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
var helpers_1 = require('../helpers');
var chmodLikeFunction = ['chmod', 'chmodSync', 'fchmod', 'fchmodSync', 'lchmod', 'lchmodSync'];
exports.rule = {
  meta: {
    messages: {
      safePermission: 'Make sure this permission is safe.',
    },
  },
  create: function (context) {
    function isChmodLikeFunction(node) {
      var callee = node.callee;
      if (callee.type !== 'MemberExpression') {
        return false;
      }
      // to support fs promises we are only checking the name of the function
      return helpers_1.isIdentifier.apply(
        void 0,
        __spreadArray([callee.property], chmodLikeFunction, false),
      );
    }
    function modeFromLiteral(modeExpr) {
      var modeValue = modeExpr.value;
      var mode = null;
      if (typeof modeValue === 'string') {
        mode = Number.parseInt(modeValue, 8);
      } else if (typeof modeValue === 'number') {
        var raw = modeExpr.raw;
        // ts parser interprets number starting with 0 as decimal, we need to parse it as octal value
        if (
          (raw === null || raw === void 0 ? void 0 : raw.startsWith('0')) &&
          !raw.startsWith('0o')
        ) {
          mode = Number.parseInt(raw, 8);
        } else {
          mode = modeValue;
        }
      }
      return mode;
    }
    // fs.constants have these value only when running on linux, we need to hardcode them to be able to test on win
    var FS_CONST = {
      S_IRWXU: 448,
      S_IRUSR: 256,
      S_IWUSR: 128,
      S_IXUSR: 64,
      S_IRWXG: 56,
      S_IRGRP: 32,
      S_IWGRP: 16,
      S_IXGRP: 8,
      S_IRWXO: 7,
      S_IROTH: 4,
      S_IWOTH: 2,
      S_IXOTH: 1,
    };
    function modeFromMemberExpression(modeExpr) {
      var object = modeExpr.object,
        property = modeExpr.property;
      if (
        (0, helpers_1.isMemberExpression)(object, 'fs', 'constants') &&
        property.type === 'Identifier'
      ) {
        return FS_CONST[property.name];
      }
      return null;
    }
    function modeFromExpression(expr, visited) {
      if (!expr) {
        return null;
      }
      if (expr.type === 'MemberExpression') {
        return modeFromMemberExpression(expr);
      } else if (expr.type === 'Literal') {
        return modeFromLiteral(expr);
      } else if (expr.type === 'Identifier') {
        var usage = (0, helpers_1.getUniqueWriteUsage)(context, expr.name);
        if (usage && !visited.has(usage)) {
          visited.add(usage);
          return modeFromExpression(usage, visited);
        }
      } else if (expr.type === 'BinaryExpression') {
        var left = expr.left,
          operator = expr.operator,
          right = expr.right;
        if (operator === '|') {
          var leftValue = modeFromExpression(left, visited);
          var rightValue = modeFromExpression(right, visited);
          if (leftValue && rightValue) {
            return leftValue | rightValue;
          }
        }
      }
      return null;
    }
    function checkModeArgument(node, moduloTest) {
      var visited = new Set();
      var mode = modeFromExpression(node, visited);
      if (mode !== null && !isNaN(mode) && mode % 8 !== moduloTest) {
        context.report({
          node: node,
          messageId: 'safePermission',
        });
      }
    }
    return {
      CallExpression: function (node) {
        var callExpression = node;
        if (isChmodLikeFunction(callExpression)) {
          checkModeArgument(callExpression.arguments[0], 0);
          checkModeArgument(callExpression.arguments[1], 0);
        } else if (
          (0, helpers_1.getFullyQualifiedName)(context, callExpression) === 'process.umask'
        ) {
          checkModeArgument(callExpression.arguments[0], 7);
        }
      },
    };
  },
};
