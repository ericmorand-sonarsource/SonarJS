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
// https://sonarsource.github.io/rspec/#/rspec/S5869/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
var regex_1 = require('../helpers/regex');
var parameters_1 = require('../../linter/parameters');
exports.rule = (0, regex_1.createRegExpRule)(
  function (context) {
    var flags;
    return {
      onRegExpLiteralEnter: function (node) {
        flags = node.flags;
      },
      onCharacterClassEnter: function (node) {
        var duplicates = new Set();
        var characterClass = new regex_1.SimplifiedRegexCharacterClass(flags);
        node.elements.forEach(function (element) {
          var intersections = new regex_1.SimplifiedRegexCharacterClass(
            flags,
            element,
          ).findIntersections(characterClass);
          if (intersections.length > 0) {
            intersections.forEach(function (intersection) {
              return duplicates.add(intersection);
            });
            duplicates.add(element);
          }
          characterClass.add(element);
        });
        if (duplicates.size > 0) {
          var primary = duplicates[0],
            secondaries = duplicates.slice(1);
          var secondaryLocations = [];
          var messages = [];
          for (var _i = 0, secondaries_1 = secondaries; _i < secondaries_1.length; _i++) {
            var secondary = secondaries_1[_i];
            var loc = (0, regex_1.getRegexpLocation)(context.node, secondary, context);
            if (loc) {
              secondaryLocations.push({ loc: loc });
              messages.push('Additional duplicate');
            }
          }
          context.reportRegExpNode({
            message: (0, helpers_1.toEncodedMessage)(
              'Remove duplicates in this character class.',
              secondaryLocations,
              messages,
            ),
            node: context.node,
            regexpNode: primary,
          });
        }
      },
    };
  },
  {
    meta: {
      schema: [
        {
          // internal parameter for rules having secondary locations
          enum: [parameters_1.SONAR_RUNTIME],
        },
      ],
    },
  },
);
