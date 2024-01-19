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
// https://sonarsource.github.io/rspec/#/rspec/S6679/javascript
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
var __rest =
  (this && this.__rest) ||
  function (s, e) {
    var t = {};
    for (var p in s)
      if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === 'function')
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
          t[p[i]] = s[p[i]];
      }
    return t;
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.decorate = void 0;
var helpers_1 = require('../helpers');
function decorate(rule) {
  return (0, helpers_1.interceptReport)(rule, function (context, reportDescriptor) {
    rule.meta.hasSuggestions = true;
    if ('node' in reportDescriptor && 'messageId' in reportDescriptor) {
      var node_1 = reportDescriptor.node,
        messageId = reportDescriptor.messageId,
        rest = __rest(reportDescriptor, ['node', 'messageId']),
        operators = new Set(['===', '==', '!==', '!=']);
      if (
        node_1.type === 'BinaryExpression' &&
        operators.has(node_1.operator) &&
        node_1.left.type !== 'Literal'
      ) {
        var prefix_1 = node_1.operator.startsWith('!') ? '' : '!',
          value_1 = context.sourceCode.getText(node_1.left),
          suggest = [
            {
              desc: 'Replace self-compare with Number.isNaN()',
              fix: function (fixer) {
                return fixer.replaceText(
                  node_1,
                  ''.concat(prefix_1, 'Number.isNaN(').concat(value_1, ')'),
                );
              },
            },
          ];
        context.report(
          __assign(
            __assign(
              { node: node_1, message: "Use 'Number.isNaN()' to check for 'NaN' value" },
              rest,
            ),
            { suggest: suggest },
          ),
        );
      }
    }
  });
}
exports.decorate = decorate;
