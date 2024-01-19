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
// https://sonarsource.github.io/rspec/#/rspec/S6478/javascript
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
var locations_1 = require('eslint-plugin-sonarjs/lib/utils/locations');
function decorate(rule) {
  return (0, helpers_1.interceptReportForReact)(rule, function (context, report) {
    var message =
      'Move this component definition out of the parent component and pass data as props.';
    var node = report.node;
    var loc = getMainNodeLocation(node, context);
    if (loc) {
      context.report(__assign(__assign({}, report), { loc: loc, message: message }));
    } else {
      context.report(__assign(__assign({}, report), { message: message }));
    }
  });
  function getMainNodeLocation(node, context) {
    var _a;
    /* class components */
    if (node.type === 'ClassDeclaration' || node.type === 'ClassExpression') {
      if (node.id) {
        return node.id.loc;
      } else {
        return (_a = context.sourceCode.getFirstToken(node, function (token) {
          return token.value === 'class';
        })) === null || _a === void 0
          ? void 0
          : _a.loc;
      }
    }
    /* functional components */
    if (helpers_1.functionLike.has(node.type)) {
      var fun = node;
      var ctx = context;
      return (0, locations_1.getMainFunctionTokenLocation)(fun, fun.parent, ctx);
    }
    /* should not happen */
    return node.loc;
  }
}
exports.decorate = decorate;
