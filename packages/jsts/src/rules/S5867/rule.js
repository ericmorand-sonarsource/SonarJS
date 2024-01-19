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
// https://sonarsource.github.io/rspec/#/rspec/S5867/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
var regex_1 = require('../helpers/regex');
var parameters_1 = require('../../linter/parameters');
exports.rule = (0, regex_1.createRegExpRule)(
  function (context) {
    var unicodeProperties = [];
    var unicodeCharacters = [];
    var rawPattern;
    var isUnicodeEnabled = false;
    return {
      onRegExpLiteralEnter: function (node) {
        rawPattern = node.raw;
        isUnicodeEnabled = node.flags.unicode;
      },
      onQuantifierEnter: function (quantifier) {
        if (isUnicodeEnabled) {
          return;
        }
        /* \u{hhhh}, \u{hhhhh} */
        var raw = quantifier.raw,
          hex = quantifier.min;
        if (
          raw.startsWith('\\u') &&
          !raw.includes(',') &&
          ['hhhh'.length, 'hhhhh'.length].includes(hex.toString().length)
        ) {
          unicodeCharacters.push(quantifier);
        }
      },
      onCharacterEnter: function (character) {
        if (isUnicodeEnabled) {
          return;
        }
        var c = character.raw;
        if (c !== '\\p' && c !== '\\P') {
          return;
        }
        var state = 'start';
        var offset = character.start + c.length;
        var nextChar;
        do {
          nextChar = rawPattern[offset];
          offset++;
          switch (state) {
            case 'start':
              if (nextChar === '{') {
                state = 'openingBracket';
              } else {
                state = 'end';
              }
              break;
            case 'openingBracket':
              if (/[a-zA-Z]/.test(nextChar)) {
                state = 'alpha';
              } else {
                state = 'end';
              }
              break;
            case 'alpha':
              if (/[a-zA-Z]/.test(nextChar)) {
                state = 'alpha';
              } else if (nextChar === '=') {
                state = 'equal';
              } else if (nextChar === '}') {
                state = 'closingBracket';
              } else {
                state = 'end';
              }
              break;
            case 'equal':
              if (/[a-zA-Z]/.test(nextChar)) {
                state = 'alpha1';
              } else {
                state = 'end';
              }
              break;
            case 'alpha1':
              if (/[a-zA-Z]/.test(nextChar)) {
                state = 'alpha1';
              } else if (nextChar === '}') {
                state = 'closingBracket';
              } else {
                state = 'end';
              }
              break;
            case 'closingBracket':
              state = 'end';
              unicodeProperties.push({ character: character, offset: offset - c.length - 1 });
              break;
          }
        } while (state !== 'end');
      },
      onRegExpLiteralLeave: function (regexp) {
        if (!isUnicodeEnabled && (unicodeProperties.length > 0 || unicodeCharacters.length > 0)) {
          var secondaryLocations_1 = [];
          var secondaryMessages_1 = [];
          unicodeProperties.forEach(function (p) {
            var loc = (0, regex_1.getRegexpLocation)(context.node, p.character, context, [
              0,
              p.offset,
            ]);
            if (loc) {
              secondaryLocations_1.push({ loc: loc });
              secondaryMessages_1.push('Unicode property');
            }
          });
          unicodeCharacters.forEach(function (c) {
            var loc = (0, regex_1.getRegexpLocation)(context.node, c, context);
            if (loc) {
              secondaryLocations_1.push({ loc: loc });
              secondaryMessages_1.push('Unicode character');
            }
          });
          context.reportRegExpNode({
            message: (0, helpers_1.toEncodedMessage)(
              "Enable the 'u' flag for this regex using Unicode constructs.",
              secondaryLocations_1,
              secondaryMessages_1,
            ),
            node: context.node,
            regexpNode: regexp,
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
