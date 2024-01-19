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
// https://sonarsource.github.io/rspec/#/rspec/S6535/javascript
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
exports.rule = void 0;
var core_1 = require('../core');
var helpers_1 = require('../helpers');
/**
 * We want to merge ESLint rules 'no-useless-escape' and 'no-nonoctal-decimal-escape'. However,
 * both share a common message id 'escapeBackslash' but a different description for quickfixes.
 * To prevent one overwritting the other, we need to decorate one and map the conflicting message
 * id to a different one when intercepting a report.
 *
 * Here we arbitrarily choose to decorate 'no-nonoctal-decimal-escape'.
 */
var noUselessEscapeRule = core_1.eslintRules['no-useless-escape'];
var noNonoctalDecimalEscapeRule = core_1.eslintRules['no-nonoctal-decimal-escape'];
/**
 * We replace the message id 'escapeBackslash' of 'no-nonoctal-decimal-escape' with 'nonOctalEscapeBacklash'.
 */
noNonoctalDecimalEscapeRule.meta.messages['nonOctalEscapeBacklash'] =
  noNonoctalDecimalEscapeRule.meta.messages['escapeBackslash'];
delete noNonoctalDecimalEscapeRule.meta.messages['escapeBackslash'];
/**
 * We decorate 'no-nonoctal-decimal-escape' to map suggestions with the message id 'escapeBackslash' to 'nonOctalEscapeBacklash'.
 */
var decoratedNoNonoctalDecimalEscapeRule = decorateNoNonoctalDecimalEscape(
  noNonoctalDecimalEscapeRule,
);
function decorateNoNonoctalDecimalEscape(rule) {
  return (0, helpers_1.interceptReport)(rule, function (context, descriptor) {
    var suggest = descriptor.suggest,
      rest = __rest(descriptor, ['suggest']);
    suggest === null || suggest === void 0
      ? void 0
      : suggest.forEach(function (s) {
          var suggestion = s;
          if (suggestion.messageId === 'escapeBackslash') {
            suggestion.messageId = 'nonOctalEscapeBacklash';
          }
        });
    context.report(__assign({ suggest: suggest }, rest));
  });
}
exports.rule = {
  // meta of `no-useless-escape` and `no-nonoctal-decimal-escape` are required for issue messages and quickfixes
  meta: {
    hasSuggestions: true,
    messages: __assign(
      __assign({}, noUselessEscapeRule.meta.messages),
      decoratedNoNonoctalDecimalEscapeRule.meta.messages,
    ),
  },
  create: function (context) {
    var noUselessEscapeListener = noUselessEscapeRule.create(context);
    var decoratedNoNonoctalDecimalEscapeListener =
      decoratedNoNonoctalDecimalEscapeRule.create(context);
    return (0, helpers_1.mergeRules)(
      noUselessEscapeListener,
      decoratedNoNonoctalDecimalEscapeListener,
    );
  },
};
