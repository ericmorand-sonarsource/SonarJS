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
// https://sonarsource.github.io/rspec/#/rspec/S6666/javascript
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
exports.decorate = void 0;
var helpers_1 = require('../helpers');
// core implementation of this rule does not provide quick fixes
function decorate(rule) {
  rule.meta.hasSuggestions = true;
  return (0, helpers_1.interceptReport)(rule, function (context, reportDescriptor) {
    var suggest = [];
    var node = reportDescriptor.node;
    if (
      node.type === 'CallExpression' &&
      node.callee.type === 'MemberExpression' &&
      node.arguments.length === 2
    ) {
      var _a = node.callee,
        object = _a.object,
        property = _a.property,
        _b = node.arguments,
        args = _b[1];
      if (
        property.type === 'Identifier' &&
        property.name === 'apply' &&
        object.range &&
        args.range
      ) {
        var range_1 = [object.range[1], args.range[0]];
        suggest.push({
          desc: 'Replace apply() with spread syntax',
          fix: function (fixer) {
            return fixer.replaceTextRange(range_1, '(...');
          },
        });
      }
    }
    context.report(__assign(__assign({}, reportDescriptor), { suggest: suggest }));
  });
}
exports.decorate = decorate;
