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
// https://sonarsource.github.io/rspec/#/rspec/S3854/javascript
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
var helpers_1 = require('../helpers');
var constructorSuperRule = core_1.eslintRules['constructor-super'];
var noThisBeforeSuperRule = core_1.eslintRules['no-this-before-super'];
exports.rule = {
  // meta of constructor-super and no-this-before-super is required for issue messages
  meta: {
    messages: __assign(
      __assign({}, constructorSuperRule.meta.messages),
      noThisBeforeSuperRule.meta.messages,
    ),
  },
  create: function (context) {
    var constructorSuperListener = constructorSuperRule.create(context);
    var notThisBeforeSuperListener = noThisBeforeSuperRule.create(context);
    return (0, helpers_1.mergeRules)(constructorSuperListener, notThisBeforeSuperListener);
  },
};
