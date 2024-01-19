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
// https://sonarsource.github.io/rspec/#/rspec/S6326/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var regex_1 = require('../helpers/regex');
exports.rule = (0, regex_1.createRegExpRule)(
  function (context) {
    var rawPattern;
    return {
      onRegExpLiteralEnter: function (node) {
        rawPattern = node.raw;
      },
      onCharacterEnter: function (node) {
        if (node.raw !== ' ' || node.parent.type === 'CharacterClass') {
          return;
        }
        var nextChar = rawPattern[node.start + 1];
        if (nextChar !== ' ') {
          var spacesBefore = countSpacesBefore(rawPattern, node.start);
          if (spacesBefore > 0) {
            var spacesNumber = spacesBefore + 1;
            var quantifier_1 = '{'.concat(spacesNumber, '}');
            var _a = (0, regex_1.getRegexpRange)(context.node, node),
              start = _a[0],
              end = _a[1];
            var range_1 = [start - spacesNumber + 1, end];
            context.reportRegExpNode({
              message: 'If multiple spaces are required here, use number quantifier ('.concat(
                quantifier_1,
                ').',
              ),
              regexpNode: node,
              offset: [-spacesNumber + 1, 0],
              node: context.node,
              suggest: [
                {
                  desc: 'Use quantifier '.concat(quantifier_1),
                  fix: function (fixer) {
                    return fixer.replaceTextRange(range_1, ' '.concat(quantifier_1));
                  },
                },
              ],
            });
          }
        }
      },
    };
  },
  {
    meta: {
      hasSuggestions: true,
    },
  },
);
function countSpacesBefore(pattern, index) {
  var counter = 0;
  for (var i = index - 1; i > 0; i--) {
    if (pattern[i] === ' ') {
      counter++;
    } else {
      break;
    }
  }
  return counter;
}
