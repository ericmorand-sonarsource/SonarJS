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
// https://sonarsource.github.io/rspec/#/rspec/S4323/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
var parameters_1 = require('../../linter/parameters');
var TYPE_THRESHOLD = 2;
var USAGE_THRESHOLD = 2;
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
    var usage;
    return {
      Program: function () {
        return (usage = new Map());
      },
      'Program:exit': function () {
        return usage.forEach(function (nodes) {
          if (nodes.length > USAGE_THRESHOLD) {
            var node = nodes[0],
              rest = nodes.slice(1);
            var kind = node.type === 'TSUnionType' ? 'union' : 'intersection';
            var message = (0, helpers_1.toEncodedMessage)(
              'Replace this '.concat(kind, ' type with a type alias.'),
              rest,
              Array(rest.length).fill('Following occurrence.'),
            );
            context.report({ message: message, loc: node.loc });
          }
        });
      },
      'TSUnionType, TSIntersectionType': function (node) {
        var ancestors = context.getAncestors();
        var declaration = ancestors.find(function (ancestor) {
          return ancestor.type === 'TSTypeAliasDeclaration';
        });
        if (!declaration) {
          var composite = node;
          if (composite.types.length > TYPE_THRESHOLD) {
            var text = composite.types
              .map(function (typeNode) {
                return context.sourceCode.getText(typeNode);
              })
              .sort(function (a, b) {
                return a.localeCompare(b);
              })
              .join('|');
            var occurrences = usage.get(text);
            if (!occurrences) {
              occurrences = [composite];
              usage.set(text, occurrences);
            } else {
              occurrences.push(composite);
            }
          }
        }
      },
    };
  },
};
