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
// https://sonarsource.github.io/rspec/#/rspec/S5868/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
var regex_1 = require('../helpers/regex');
var regexpp_1 = require('@eslint-community/regexpp');
var MODIFIABLE_REGEXP_FLAGS_TYPES = ['Literal', 'TemplateLiteral', 'TaggedTemplateExpression'];
var metadata = {
  meta: {
    hasSuggestions: true,
  },
};
exports.rule = (0, regex_1.createRegExpRule)(function (context) {
  function characters(nodes) {
    var current = [];
    var sequences = [current];
    for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
      var node = nodes_1[_i];
      if (node.type === 'Character') {
        current.push(node);
      } else if (node.type === 'CharacterClassRange') {
        // for following regexp [xa-z] we produce [[xa],[z]]
        // we would report for example if instead of 'xa' there would be unicode combined class
        current.push(node.min);
        current = [node.max];
        sequences.push(current);
      } else if (node.type === 'CharacterSet' && current.length > 0) {
        // CharacterSet is for example [\d], ., or \p{ASCII}
        // see https://github.com/mysticatea/regexpp/blob/master/src/ast.ts#L222
        current = [];
        sequences.push(current);
      }
    }
    return sequences;
  }
  function checkSequence(sequence) {
    // Stop on the first illegal character in the sequence
    for (var index = 0; index < sequence.length; index++) {
      if (checkCharacter(sequence[index], index, sequence)) {
        return;
      }
    }
  }
  function checkCharacter(character, index, characters) {
    // Stop on the first failed check as there may be overlaps between checks
    // for instance a zero-width-sequence containing a modified emoji.
    for (var _i = 0, characterChecks_1 = characterChecks; _i < characterChecks_1.length; _i++) {
      var check = characterChecks_1[_i];
      if (check(character, index, characters)) {
        return true;
      }
    }
    return false;
  }
  function checkCombinedCharacter(character, index, characters) {
    var reported = false;
    if (
      index !== 0 &&
      isCombiningCharacter(character.value) &&
      !isCombiningCharacter(characters[index - 1].value)
    ) {
      var combinedChar = characters[index - 1].raw + characters[index].raw;
      var message = "Move this Unicode combined character '".concat(
        combinedChar,
        "' outside of the character class",
      );
      context.reportRegExpNode({
        regexpNode: characters[index],
        node: context.node,
        message: message,
      });
      reported = true;
    }
    return reported;
  }
  function checkSurrogatePairTailCharacter(character, index, characters) {
    var _a;
    var reported = false;
    if (index !== 0 && isSurrogatePair(characters[index - 1].value, character.value)) {
      var surrogatePair = characters[index - 1].raw + characters[index].raw;
      var message = "Move this Unicode surrogate pair '".concat(
        surrogatePair,
        "' outside of the character class or use 'u' flag",
      );
      var pattern =
        (_a = (0, regex_1.getPatternFromNode)(context.node, context)) === null || _a === void 0
          ? void 0
          : _a.pattern;
      var suggest = void 0;
      if (pattern && isValidWithUnicodeFlag(pattern)) {
        suggest = [
          {
            desc: "Add unicode 'u' flag to regex",
            fix: function (fixer) {
              return addUnicodeFlag(fixer, context.node);
            },
          },
        ];
      }
      context.reportRegExpNode({
        regexpNode: characters[index],
        node: context.node,
        message: message,
        suggest: suggest,
      });
      reported = true;
    }
    return reported;
  }
  function addUnicodeFlag(fixer, node) {
    var _a;
    if ((0, helpers_1.isRegexLiteral)(node)) {
      return insertTextAfter(fixer, node, 'u');
    }
    var regExpConstructor = getRegExpConstructor(node);
    if (!regExpConstructor) {
      return null;
    }
    var args = regExpConstructor.arguments;
    if (args.length === 1) {
      var token = sourceCode.getLastToken(regExpConstructor, { skip: 1 });
      return insertTextAfter(fixer, token, ', "u"');
    }
    if (
      args.length > 1 &&
      ((_a = args[1]) === null || _a === void 0 ? void 0 : _a.range) &&
      hasModifiableFlags(regExpConstructor)
    ) {
      var _b = args[1].range,
        start = _b[0],
        end = _b[1];
      return fixer.insertTextAfterRange([start, end - 1], 'u');
    }
    return null;
  }
  function checkModifiedEmojiCharacter(character, index, characters) {
    var reported = false;
    if (
      index !== 0 &&
      isEmojiModifier(character.value) &&
      !isEmojiModifier(characters[index - 1].value)
    ) {
      var modifiedEmoji = characters[index - 1].raw + characters[index].raw;
      var message = "Move this Unicode modified Emoji '".concat(
        modifiedEmoji,
        "' outside of the character class",
      );
      context.reportRegExpNode({
        regexpNode: characters[index],
        node: context.node,
        message: message,
      });
      reported = true;
    }
    return reported;
  }
  function checkRegionalIndicatorCharacter(character, index, characters) {
    var reported = false;
    if (
      index !== 0 &&
      isRegionalIndicator(character.value) &&
      isRegionalIndicator(characters[index - 1].value)
    ) {
      var regionalIndicator = characters[index - 1].raw + characters[index].raw;
      var message = "Move this Unicode regional indicator '".concat(
        regionalIndicator,
        "' outside of the character class",
      );
      context.reportRegExpNode({
        regexpNode: characters[index],
        node: context.node,
        message: message,
      });
      reported = true;
    }
    return reported;
  }
  function checkZeroWidthJoinerCharacter(character, index, characters) {
    var reported = false;
    if (
      index !== 0 &&
      index !== characters.length - 1 &&
      isZeroWidthJoiner(character.value) &&
      !isZeroWidthJoiner(characters[index - 1].value) &&
      !isZeroWidthJoiner(characters[index + 1].value)
    ) {
      // It's practically difficult to determine the full joined character sequence
      // as it may join more than 2 elements that consist of characters or modified Emojis
      // see: https://unicode.org/emoji/charts/emoji-zwj-sequences.html
      var message = 'Move this Unicode joined character sequence outside of the character class';
      context.reportRegExpNode({
        regexpNode: characters[index - 1],
        node: context.node,
        message: message,
      });
      reported = true;
    }
    return reported;
  }
  function isValidWithUnicodeFlag(pattern) {
    try {
      validator.validatePattern(pattern, undefined, undefined, true);
      return true;
    } catch (_a) {
      return false;
    }
  }
  var sourceCode = context.sourceCode;
  var validator = new regexpp_1.RegExpValidator();
  // The order matters as surrogate pair check may trigger at the same time as zero-width-joiner.
  var characterChecks = [
    checkCombinedCharacter,
    checkZeroWidthJoinerCharacter,
    checkModifiedEmojiCharacter,
    checkRegionalIndicatorCharacter,
    checkSurrogatePairTailCharacter,
  ];
  return {
    onCharacterClassEnter: function (ccNode) {
      for (var _i = 0, _a = characters(ccNode.elements); _i < _a.length; _i++) {
        var chars = _a[_i];
        checkSequence(chars);
      }
    },
  };
}, metadata);
function isCombiningCharacter(codePoint) {
  return /^[\p{Mc}\p{Me}\p{Mn}]$/u.test(String.fromCodePoint(codePoint));
}
function isSurrogatePair(lead, tail) {
  return lead >= 0xd800 && lead < 0xdc00 && tail >= 0xdc00 && tail < 0xe000;
}
function isEmojiModifier(code) {
  return code >= 0x1f3fb && code <= 0x1f3ff;
}
function isRegionalIndicator(code) {
  return code >= 0x1f1e6 && code <= 0x1f1ff;
}
function isZeroWidthJoiner(code) {
  return code === 0x200d;
}
function getRegExpConstructor(node) {
  return (0, helpers_1.ancestorsChain)(node, new Set(['CallExpression', 'NewExpression'])).find(
    function (n) {
      return (0, regex_1.isRegExpConstructor)(n);
    },
  );
}
function hasModifiableFlags(regExpConstructor) {
  var _a, _b, _c, _d;
  var args = regExpConstructor.arguments;
  return (
    typeof ((_b = (_a = args[1]) === null || _a === void 0 ? void 0 : _a.range) === null ||
    _b === void 0
      ? void 0
      : _b[0]) === 'number' &&
    typeof ((_d = (_c = args[1]) === null || _c === void 0 ? void 0 : _c.range) === null ||
    _d === void 0
      ? void 0
      : _d[1]) === 'number' &&
    (0, regex_1.getFlags)(regExpConstructor) != null &&
    MODIFIABLE_REGEXP_FLAGS_TYPES.includes(args[1].type)
  );
}
function insertTextAfter(fixer, node, text) {
  return node ? fixer.insertTextAfter(node, text) : null;
}
