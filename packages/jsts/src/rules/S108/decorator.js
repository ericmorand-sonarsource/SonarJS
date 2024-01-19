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
// https://sonarsource.github.io/rspec/#/rspec/S108/javascript
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
exports.suggestEmptyBlockQuickFix = exports.decorate = void 0;
var helpers_1 = require('../helpers');
// core implementation of this rule does not provide quick fixes
function decorate(rule) {
  rule.meta.hasSuggestions = true;
  return (0, helpers_1.interceptReport)(rule, function (context, reportDescriptor) {
    var node = reportDescriptor.node;
    var type = reportDescriptor.data.type;
    var openingBrace;
    if (node.type === 'SwitchStatement') {
      openingBrace = context.sourceCode.getTokenAfter(node.discriminant, function (token) {
        return token.value === '{';
      });
    } /* BlockStatement */ else {
      openingBrace = context.sourceCode.getFirstToken(node);
    }
    var closingBrace = context.sourceCode.getLastToken(node);
    suggestEmptyBlockQuickFix(context, reportDescriptor, type, openingBrace, closingBrace);
  });
}
exports.decorate = decorate;
function suggestEmptyBlockQuickFix(context, descriptor, blockType, openingBrace, closingBrace) {
  var commentPlaceholder;
  if (openingBrace.loc.start.line === closingBrace.loc.start.line) {
    commentPlaceholder = ' /* TODO document why this '.concat(blockType, ' is empty */ ');
  } else {
    var columnOffset = closingBrace.loc.start.column;
    var padding = ' '.repeat(columnOffset);
    commentPlaceholder = '\n'
      .concat(padding, '  // TODO document why this ')
      .concat(blockType, ' is empty\n')
      .concat(padding);
  }
  context.report(
    __assign(__assign({}, descriptor), {
      suggest: [
        {
          desc: 'Insert placeholder comment',
          fix: function (fixer) {
            return fixer.insertTextAfter(openingBrace, commentPlaceholder);
          },
        },
      ],
    }),
  );
}
exports.suggestEmptyBlockQuickFix = suggestEmptyBlockQuickFix;
