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
// https://sonarsource.github.io/rspec/#/rspec/S6749/javascript
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
/**
 * The core implementation of the rule reports on empty React fragments.
 * Also, one of the two issue messages include a Unicode character.
 */
function decorate(rule) {
  rule.meta.hasSuggestions = true;
  rule.meta.messages = __assign(__assign({}, rule.meta.messages), {
    /* Map to a more friendly message */
    NeedsMoreChildren: 'A fragment with only one child is redundant.',
  });
  return (0, helpers_1.interceptReport)(rule, function (context, descriptor) {
    var node = descriptor.node;
    /* Ignore empty fragments */
    if (node.type === 'JSXFragment' && node.children.length === 0) {
      return;
    }
    context.report(descriptor);
  });
}
exports.decorate = decorate;
