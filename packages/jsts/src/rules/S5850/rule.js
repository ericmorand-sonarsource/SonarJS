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
// https://sonarsource.github.io/rspec/#/rspec/S5850/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var regex_1 = require('../helpers/regex');
var Position;
(function (Position) {
  Position[(Position['BEGINNING'] = 0)] = 'BEGINNING';
  Position[(Position['END'] = 1)] = 'END';
})(Position || (Position = {}));
exports.rule = (0, regex_1.createRegExpRule)(function (context) {
  return {
    onPatternEnter: function (pattern) {
      var alternatives = pattern.alternatives;
      if (
        alternatives.length > 1 &&
        (anchoredAt(alternatives, Position.BEGINNING) || anchoredAt(alternatives, Position.END)) &&
        notAnchoredElseWhere(alternatives)
      ) {
        context.reportRegExpNode({
          message:
            'Group parts of the regex together to make the intended operator precedence explicit.',
          node: context.node,
          regexpNode: pattern,
        });
      }
    },
  };
});
function anchoredAt(alternatives, position) {
  var itemIndex = position === Position.BEGINNING ? 0 : alternatives.length - 1;
  var firstOrLast = alternatives[itemIndex];
  return isAnchored(firstOrLast, position);
}
function notAnchoredElseWhere(alternatives) {
  if (
    isAnchored(alternatives[0], Position.END) ||
    isAnchored(alternatives[alternatives.length - 1], Position.BEGINNING)
  ) {
    return false;
  }
  for (var _i = 0, _a = alternatives.slice(1, alternatives.length - 1); _i < _a.length; _i++) {
    var alternative = _a[_i];
    if (isAnchored(alternative, Position.BEGINNING) || isAnchored(alternative, Position.END)) {
      return false;
    }
  }
  return true;
}
function isAnchored(alternative, position) {
  var elements = alternative.elements;
  if (elements.length === 0) {
    return false;
  }
  var index = position === Position.BEGINNING ? 0 : elements.length - 1;
  var firstOrLast = elements[index];
  return isAnchor(firstOrLast);
}
function isAnchor(element) {
  return element.type === 'Assertion' && (element.kind === 'start' || element.kind === 'end');
}
