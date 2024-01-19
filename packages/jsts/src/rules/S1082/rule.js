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
// https://sonarsource.github.io/rspec/#/rspec/S1082/javascript
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
var eslint_plugin_jsx_a11y_1 = require('eslint-plugin-jsx-a11y');
var mouseEventsHaveKeyEvents = eslint_plugin_jsx_a11y_1.rules['mouse-events-have-key-events'];
var clickEventsHaveKeyEvents = eslint_plugin_jsx_a11y_1.rules['click-events-have-key-events'];
exports.rule = {
  meta: {
    hasSuggestions: true,
    messages: __assign(
      __assign({}, mouseEventsHaveKeyEvents.meta.messages),
      clickEventsHaveKeyEvents.meta.messages,
    ),
  },
  create: function (context) {
    var mouseEventsHaveKeyEventsListener = mouseEventsHaveKeyEvents.create(context);
    var clickEventsHaveKeyEventsListener = clickEventsHaveKeyEvents.create(context);
    return (0, helpers_1.mergeRules)(
      mouseEventsHaveKeyEventsListener,
      clickEventsHaveKeyEventsListener,
    );
  },
};
