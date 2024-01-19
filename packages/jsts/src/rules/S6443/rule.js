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
// https://sonarsource.github.io/rspec/#/rspec/S6443/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
var declarationSelector = [
  ':matches(',
  [
    'VariableDeclarator[init.callee.name="useState"]',
    'VariableDeclarator[init.callee.object.type="Identifier"][init.callee.property.name="useState"]',
  ].join(','),
  ')',
  '[id.type="ArrayPattern"]',
  '[id.elements.length=2]',
  '[id.elements.0.type="Identifier"]',
  '[id.elements.1.type="Identifier"]',
].join('');
var callSelector = [
  'CallExpression[callee.type="Identifier"]',
  '[arguments.length=1]',
  '[arguments.0.type="Identifier"]',
].join('');
exports.rule = {
  meta: {
    messages: {
      uselessSetState: 'Change the argument of this setter to not use its matching state variable',
    },
  },
  create: function (context) {
    var _a;
    var referencesBySetterName = {};
    return (
      (_a = {}),
      (_a[declarationSelector] = function (node) {
        if (isReactCall(context, node.init)) {
          var elements = node.id.elements;
          var setter = elements[1].name;
          referencesBySetterName[setter] = {
            setter: (0, helpers_1.getVariableFromName)(context, setter),
            value: (0, helpers_1.getVariableFromName)(context, elements[0].name),
          };
        }
      }),
      (_a[callSelector] = function (node) {
        var setter = (0, helpers_1.getVariableFromName)(context, node.callee.name);
        var value = (0, helpers_1.getVariableFromName)(context, node.arguments[0].name);
        var key = setter === null || setter === void 0 ? void 0 : setter.name;
        if (
          setter &&
          value &&
          referencesBySetterName.hasOwnProperty(key) &&
          referencesBySetterName[key].setter === setter &&
          referencesBySetterName[key].value === value
        ) {
          context.report({
            messageId: 'uselessSetState',
            node: node,
          });
        }
      }),
      _a
    );
  },
};
function isReactCall(context, callExpr) {
  var fqn = (0, helpers_1.getFullyQualifiedName)(context, callExpr);
  if (fqn) {
    var module_1 = fqn.split('.')[0];
    return module_1 === 'react';
  }
  return false;
}
