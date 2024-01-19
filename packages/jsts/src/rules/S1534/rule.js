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
// https://sonarsource.github.io/rspec/#/rspec/S1534/javascript
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
var core_1 = require('../core');
var typescript_eslint_1 = require('../typescript-eslint');
var eslint_plugin_react_1 = require('eslint-plugin-react');
var helpers_1 = require('../helpers');
var decorator_1 = require('./decorator');
var noDupeKeysRule = (0, decorator_1.decorate)(core_1.eslintRules['no-dupe-keys']);
var noDupeClassMembersRule = typescript_eslint_1.tsEslintRules['no-dupe-class-members'];
var jsxNoDuplicatePropsRule = eslint_plugin_react_1.rules['jsx-no-duplicate-props'];
exports.rule = {
  /**
   * The metadata from `no-dupe-class-members` and `jsx-no-duplicate-props` are required for issue messages.
   * However, we don't include those from `no-dupe-keys` because of a duplicate message id, and we use instead
   * the message id from `no-dupe-class-members`, which is a bit more generic.
   */
  meta: {
    hasSuggestions: true,
    messages: __assign(
      __assign({}, noDupeClassMembersRule.meta.messages),
      jsxNoDuplicatePropsRule.meta.messages,
    ),
  },
  create: function (context) {
    var noDupeKeysListener = noDupeKeysRule.create(context);
    var noDupeClassMembersListener = noDupeClassMembersRule.create(context);
    var jsxNoDuplicatePropsListener = jsxNoDuplicatePropsRule.create(context);
    return (0, helpers_1.mergeRules)(
      noDupeKeysListener,
      noDupeClassMembersListener,
      jsxNoDuplicatePropsListener,
    );
  },
};
