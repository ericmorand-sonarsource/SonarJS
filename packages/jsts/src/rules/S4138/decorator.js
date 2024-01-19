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
// https://sonarsource.github.io/rspec/#/rspec/S4138/javascript
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
var element = 'element';
// core implementation of this rule does not provide quick fixes
function decorate(rule) {
  rule.meta.hasSuggestions = true;
  return (0, helpers_1.interceptReport)(rule, function (context, reportDescriptor) {
    var forStmt = reportDescriptor.node;
    var suggest = [];
    if (isFixable(context.getScope())) {
      suggest.push({
        desc: 'Replace with "for of" loop',
        fix: function (fixer) {
          return rewriteForStatement(forStmt, context, fixer);
        },
      });
    }
    context.report(__assign(__assign({}, reportDescriptor), { suggest: suggest }));
  });
}
exports.decorate = decorate;
function isFixable(scope) {
  return (
    scope.references.every(function (reference) {
      return reference.identifier.name !== element;
    }) && scope.childScopes.every(isFixable)
  );
}
function rewriteForStatement(forStmt, context, fixer) {
  var fixes = [];
  /* rewrite `for` header: `(init; test; update)` -> `(const element of <array>) ` */
  var openingParenthesis = context.sourceCode.getFirstToken(forStmt, function (token) {
    return token.value === '(';
  });
  var closingParenthesis = context.sourceCode.getTokenBefore(forStmt.body, function (token) {
    return token.value === ')';
  });
  var arrayExpr = extractArrayExpression(forStmt);
  var arrayText = context.sourceCode.getText(arrayExpr);
  var headerRange = [openingParenthesis.range[1], closingParenthesis.range[0]];
  var headerText = 'const '.concat(element, ' of ').concat(arrayText);
  fixes.push(fixer.replaceTextRange(headerRange, headerText));
  /* rewrite `for` body: `<array>[<index>]` -> `element` */
  var indexVar = context.getDeclaredVariables(forStmt.init)[0];
  for (var _i = 0, _a = indexVar.references; _i < _a.length; _i++) {
    var reference = _a[_i];
    var id = reference.identifier;
    if (contains(forStmt.body, id)) {
      var arrayAccess = id.parent;
      fixes.push(fixer.replaceText(arrayAccess, element));
    }
  }
  return fixes;
}
function extractArrayExpression(forStmt) {
  return forStmt.test.right.object;
}
function contains(outer, inner) {
  return outer.range[0] <= inner.range[0] && outer.range[1] >= inner.range[1];
}
