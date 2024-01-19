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
// https://sonarsource.github.io/rspec/#/rspec/S1526/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
var parameters_1 = require('../../linter/parameters');
exports.rule = {
  meta: {
    schema: [
      {
        // internal parameter for rules having secondary locations
        enum: [parameters_1.SONAR_RUNTIME],
      },
    ],
  },
  create: function (context) {
    return {
      "VariableDeclaration[kind='var']": function (node) {
        var variables = context.getDeclaredVariables(node);
        var _loop_1 = function (variable) {
          var declaration = variable.identifiers[0];
          var misused = variable.references
            .filter(function (reference) {
              return !reference.init && comesBefore(reference.identifier, declaration);
            })
            .map(function (reference) {
              return reference.identifier;
            });
          if (misused.length > 0) {
            context.report({
              message: (0, helpers_1.toEncodedMessage)(
                'Move the declaration of "'.concat(declaration.name, '" before this usage.'),
                [declaration],
                ['Declaration'],
              ),
              node: misused[0],
            });
          }
        };
        for (var _i = 0, variables_1 = variables; _i < variables_1.length; _i++) {
          var variable = variables_1[_i];
          _loop_1(variable);
        }
      },
    };
  },
};
function comesBefore(node, other) {
  var nodeLine = line(node),
    otherLine = line(other);
  return nodeLine < otherLine || (nodeLine === otherLine && column(node) < column(other));
}
function line(node) {
  return node.loc.start.line;
}
function column(node) {
  return node.loc.start.column;
}
