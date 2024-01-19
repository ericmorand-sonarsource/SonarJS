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
// https://sonarsource.github.io/rspec/#/rspec/S1788/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.decorate = void 0;
var helpers_1 = require('../helpers');
var NUM_ARGS_REDUX_REDUCER = 2;
function decorate(rule) {
  return (0, helpers_1.interceptReport)(rule, reportExempting(isReduxReducer));
}
exports.decorate = decorate;
function reportExempting(exemptionCondition) {
  return function (context, reportDescriptor) {
    var _a, _b;
    if ('node' in reportDescriptor) {
      var node_1 = reportDescriptor['node'];
      var scope = context.getScope();
      var variable = scope.variables.find(function (value) {
        return (0, helpers_1.isIdentifier)(node_1.left, value.name);
      });
      var enclosingFunction =
        (_b =
          (_a = variable === null || variable === void 0 ? void 0 : variable.defs) === null ||
          _a === void 0
            ? void 0
            : _a[0]) === null || _b === void 0
          ? void 0
          : _b.node;
      if (enclosingFunction && !exemptionCondition(enclosingFunction)) {
        context.report(reportDescriptor);
      }
    }
  };
}
function isReduxReducer(enclosingFunction) {
  if (enclosingFunction.params.length === NUM_ARGS_REDUX_REDUCER) {
    var _a = enclosingFunction.params,
      firstParam = _a[0],
      secondParam = _a[1];
    return (
      firstParam.type === 'AssignmentPattern' &&
      (0, helpers_1.isIdentifier)(firstParam.left, 'state') &&
      (0, helpers_1.isIdentifier)(secondParam, 'action')
    );
  }
  return false;
}
