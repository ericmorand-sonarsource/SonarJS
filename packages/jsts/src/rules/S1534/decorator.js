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
exports.decorate = void 0;
var helpers_1 = require('../helpers');
// core implementation of ESLint 'no-dupe-keys' does not provide quick fixes
function decorate(rule) {
  rule.meta.hasSuggestions = true;
  return (0, helpers_1.interceptReport)(rule, function (context, reportDescriptor) {
    context.report(
      __assign(__assign({}, reportDescriptor), {
        suggest: [
          {
            desc: 'Remove this duplicate property',
            fix: function (fixer) {
              var propertyToRemove = getPropertyNode(reportDescriptor, context);
              var commaAfter = context.sourceCode.getTokenAfter(propertyToRemove, function (token) {
                return token.value === ',';
              });
              var commaBefore = context.sourceCode.getTokenBefore(
                propertyToRemove,
                function (token) {
                  return token.value === ',';
                },
              );
              var start = commaBefore.range[1];
              var end = propertyToRemove.range[1];
              if (commaAfter) {
                end = commaAfter.range[1];
              } else {
                start = commaBefore.range[0];
              }
              return fixer.removeRange([start, end]);
            },
          },
        ],
      }),
    );
  });
}
exports.decorate = decorate;
function getPropertyNode(reportDescriptor, context) {
  if ('node' in reportDescriptor && 'loc' in reportDescriptor) {
    var objectLiteral = reportDescriptor['node'];
    var loc_1 = reportDescriptor['loc'];
    var transformPosToIndex_1 = function (p) {
      return context.sourceCode.getIndexFromLoc(p);
    };
    return objectLiteral.properties.find(function (property) {
      var _a, _b;
      return (
        transformPosToIndex_1((_a = property.loc) === null || _a === void 0 ? void 0 : _a.start) <=
          transformPosToIndex_1(loc_1 === null || loc_1 === void 0 ? void 0 : loc_1.start) &&
        transformPosToIndex_1((_b = property.loc) === null || _b === void 0 ? void 0 : _b.end) >=
          transformPosToIndex_1(loc_1 === null || loc_1 === void 0 ? void 0 : loc_1.end)
      );
    });
  } else {
    throw new Error('Missing properties in report descriptor for rule S1534');
  }
}
