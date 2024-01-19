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
// https://sonarsource.github.io/rspec/#/rspec/S6353/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var regex_1 = require('../helpers/regex');
exports.rule = (0, regex_1.createRegExpRule)(function (context) {
  var flags;
  return {
    onRegExpLiteralEnter: function (node) {
      flags = node.flags;
    },
    onCharacterClassEnter: function (node) {
      checkBulkyAnyCharacterClass(node, flags, context);
      checkBulkyNumericCharacterClass(node, context);
      checkBulkyAlphaNumericCharacterClass(node, context);
    },
    onQuantifierEnter: function (node) {
      checkBulkyQuantifier(node, context);
    },
  };
});
function checkBulkyAnyCharacterClass(node, flags, context) {
  if (node.negate || node.elements.length !== 2) {
    return;
  }
  var hasLowerEscapeW = false;
  var hasUpperEscapeW = false;
  var hasLowerEscapeD = false;
  var hasUpperEscapeD = false;
  var hasLowerEscapeS = false;
  var hasUpperEscapeS = false;
  node.elements.forEach(function (element) {
    hasLowerEscapeW ||
      (hasLowerEscapeW =
        element.type === 'CharacterSet' && element.kind === 'word' && !element.negate);
    hasUpperEscapeW ||
      (hasUpperEscapeW =
        element.type === 'CharacterSet' && element.kind === 'word' && element.negate);
    hasLowerEscapeD ||
      (hasLowerEscapeD =
        element.type === 'CharacterSet' && element.kind === 'digit' && !element.negate);
    hasUpperEscapeD ||
      (hasUpperEscapeD =
        element.type === 'CharacterSet' && element.kind === 'digit' && element.negate);
    hasLowerEscapeS ||
      (hasLowerEscapeS =
        element.type === 'CharacterSet' && element.kind === 'space' && !element.negate);
    hasUpperEscapeS ||
      (hasUpperEscapeS =
        element.type === 'CharacterSet' && element.kind === 'space' && element.negate);
  });
  var isBulkyAnyCharacterClass =
    (hasLowerEscapeW && hasUpperEscapeW) ||
    (hasLowerEscapeD && hasUpperEscapeD) ||
    (hasLowerEscapeS && hasUpperEscapeS && flags.dotAll);
  if (isBulkyAnyCharacterClass) {
    context.reportRegExpNode({
      message: "Use concise character class syntax '.' instead of '".concat(node.raw, "'."),
      node: context.node,
      regexpNode: node,
    });
  }
}
function checkBulkyNumericCharacterClass(node, context) {
  if (node.elements.length === 1) {
    var element = node.elements[0];
    var hasDigit = element.type === 'CharacterClassRange' && element.raw === '0-9';
    if (hasDigit) {
      var expected = node.negate ? '\\D' : '\\d';
      var actual = node.raw;
      context.reportRegExpNode({
        message: "Use concise character class syntax '"
          .concat(expected, "' instead of '")
          .concat(actual, "'."),
        node: context.node,
        regexpNode: node,
      });
    }
  }
}
function checkBulkyAlphaNumericCharacterClass(node, context) {
  if (node.elements.length === 4) {
    var hasDigit = false,
      hasLowerCase = false,
      hasUpperCase = false,
      hasUnderscore = false;
    for (var _i = 0, _a = node.elements; _i < _a.length; _i++) {
      var element = _a[_i];
      hasDigit || (hasDigit = element.type === 'CharacterClassRange' && element.raw === '0-9');
      hasLowerCase ||
        (hasLowerCase = element.type === 'CharacterClassRange' && element.raw === 'a-z');
      hasUpperCase ||
        (hasUpperCase = element.type === 'CharacterClassRange' && element.raw === 'A-Z');
      hasUnderscore || (hasUnderscore = element.type === 'Character' && element.raw === '_');
    }
    if (hasDigit && hasLowerCase && hasUpperCase && hasUnderscore) {
      var expected = node.negate ? '\\W' : '\\w';
      var actual = node.raw;
      context.reportRegExpNode({
        message: "Use concise character class syntax '"
          .concat(expected, "' instead of '")
          .concat(actual, "'."),
        node: context.node,
        regexpNode: node,
      });
    }
  }
}
function checkBulkyQuantifier(node, context) {
  var raw = node.raw;
  var message;
  var bulkyQuantifier;
  if (/\{0,1\}\??$/.test(raw)) {
    bulkyQuantifier = { concise: '?', verbose: '{0,1}' };
  } else if (/\{0,0\}\??$/.test(raw)) {
    message = 'Remove redundant '.concat(node.element.raw, '{0,0}.');
  } else if (/\{0\}\??$/.test(raw)) {
    message = 'Remove redundant '.concat(node.element.raw, '{0}.');
  } else if (/\{1,1\}\??$/.test(raw)) {
    message = 'Remove redundant quantifier {1,1}.';
  } else if (/\{1\}\??$/.test(raw)) {
    message = 'Remove redundant quantifier {1}.';
  } else if (/\{0,\}\??$/.test(raw)) {
    bulkyQuantifier = { concise: '*', verbose: '{0,}' };
  } else if (/\{1,\}\??$/.test(raw)) {
    bulkyQuantifier = { concise: '+', verbose: '{1,}' };
  } else if (/\{(\d+),\1\}\??$/.test(raw)) {
    bulkyQuantifier = {
      concise: '{'.concat(node.min, '}'),
      verbose: '{'.concat(node.min, ',').concat(node.min, '}'),
    };
  }
  if (bulkyQuantifier) {
    message = "Use concise quantifier syntax '"
      .concat(bulkyQuantifier.concise, "' instead of '")
      .concat(bulkyQuantifier.verbose, "'.");
  }
  if (message) {
    context.reportRegExpNode({
      message: message,
      node: context.node,
      regexpNode: node,
    });
  }
}
