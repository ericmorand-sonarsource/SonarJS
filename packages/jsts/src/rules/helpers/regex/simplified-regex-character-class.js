'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.SimplifiedRegexCharacterClass = void 0;
var functional_red_black_tree_1 = __importDefault(require('functional-red-black-tree'));
var MAX_CODE_POINT = 0x10ffff;
var SimplifiedRegexCharacterClass = /** @class */ (function () {
  function SimplifiedRegexCharacterClass(flags, element) {
    this.flags = flags;
    /**
     * This map defines the contents of the character class in the following way:<br>
     * For any entry {@code codepoint -> tree}, all the codepoints from {@code codepoint} up to (and excluding) the next
     * entry are in the character class and belong to the given tree.<br>
     * For any entry {@code codepoint -> null}, all the codepoints from {@code codepoint} up to (and excluding) the next
     * entry are not part of the character class.<br>
     * So a codepoint is contained in this class if and only if {@code contents.le(codePoint).value} is
     * non-null and the tree returned by {@code value} will be the element of the character class which matches that
     * code point.
     */
    this.contents = (0, functional_red_black_tree_1.default)();
    if (element) {
      this.add(element);
    }
  }
  SimplifiedRegexCharacterClass.prototype.add = function (element) {
    new SimplifiedRegexCharacterClass.Builder(this).visit(element);
  };
  SimplifiedRegexCharacterClass.prototype.findIntersections = function (that) {
    var iter = that.contents.begin;
    var intersections = [];
    if (iter.key === undefined) {
      return intersections;
    }
    while (iter.hasNext) {
      var key = iter.key,
        value = iter.value;
      iter.next();
      var to = iter.value ? iter.key : iter.key - 1;
      if (value && this.hasEntryBetween(key, to)) {
        intersections.push(value);
      }
    }
    if (iter.value && this.hasEntryBetween(iter.key, MAX_CODE_POINT)) {
      intersections.push(iter.value);
    }
    return intersections;
  };
  SimplifiedRegexCharacterClass.prototype.hasEntryBetween = function (from, to) {
    var before = this.contents.le(from);
    return (before.key !== undefined && before.value) || !this.isRangeEmpty(from + 1, to + 1);
  };
  SimplifiedRegexCharacterClass.prototype.isRangeEmpty = function (from, to) {
    var isEmpty = true;
    this.contents.forEach(
      function () {
        return (isEmpty = false);
      },
      from,
      to,
    );
    return isEmpty;
  };
  SimplifiedRegexCharacterClass.prototype.addRange = function (from, to, element) {
    var oldEntry = this.contents.le(to);
    var oldEnd = oldEntry.key === undefined ? undefined : this.contents.gt(oldEntry.key).key;
    this.contents = this.put(from, element, this.contents);
    var iterator = this.contents.begin;
    while (iterator.key !== undefined) {
      if (iterator.key > from && iterator.key <= to && iterator.value === undefined) {
        this.contents = iterator.update(element);
      }
      iterator.next();
    }
    var next = to + 1;
    if (next <= MAX_CODE_POINT) {
      if (oldEntry.key !== undefined && oldEntry.value && (oldEnd === undefined || oldEnd > next)) {
        this.contents = this.put(next, oldEntry.value, this.contents);
      } else if (this.contents.find(next).key === undefined) {
        this.contents = this.put(next, undefined, this.contents);
      }
    }
  };
  SimplifiedRegexCharacterClass.prototype.put = function (key, value, tree) {
    var entry = tree.find(key);
    if (entry.valid) {
      return entry.update(value);
    }
    return tree.insert(key, value);
  };
  SimplifiedRegexCharacterClass.Builder = /** @class */ (function () {
    function class_1(characters) {
      this.characters = characters;
    }
    class_1.prototype.visit = function (element) {
      switch (element.type) {
        case 'Character':
          this.visitCharacter(element);
          break;
        case 'CharacterClassRange':
          this.visitCharacterClassRange(element);
          break;
        case 'CharacterSet':
          this.visitCharacterSet(element);
          break;
      }
    };
    class_1.prototype.visitCharacter = function (character) {
      this.addRange(character.value, character.value, character);
    };
    class_1.prototype.visitCharacterClassRange = function (characterRange) {
      this.addRange(characterRange.min.value, characterRange.max.value, characterRange);
    };
    class_1.prototype.visitCharacterSet = function (characterSet) {
      switch (characterSet.kind) {
        case 'digit':
          if (characterSet.negate) {
            this.characters.addRange(0x00, this.codePoint('0') - 1, characterSet);
            if (this.characters.flags.unicode) {
              this.characters.addRange(this.codePoint('9') + 1, 0xff, characterSet);
            } else {
              this.characters.addRange(this.codePoint('9') + 1, MAX_CODE_POINT, characterSet);
            }
          } else {
            this.characters.addRange(this.codePoint('0'), this.codePoint('9'), characterSet);
          }
          break;
        case 'space':
          if (characterSet.negate) {
            this.characters.addRange(0x00, this.codePoint('\t') - 1, characterSet);
            this.characters.addRange(
              this.codePoint('\r') + 1,
              this.codePoint(' ') - 1,
              characterSet,
            );
            if (this.characters.flags.unicode) {
              this.characters.addRange(this.codePoint(' ') + 1, 0x84, characterSet);
              this.characters.addRange(0x86, 0x9f, characterSet);
              this.characters.addRange(0xa1, 0x167f, characterSet);
              this.characters.addRange(0x1681, 0x1fff, characterSet);
              this.characters.addRange(0x200b, 0x2027, characterSet);
              this.characters.addRange(0x202a, 0x202e, characterSet);
              this.characters.addRange(0x2030, 0x205e, characterSet);
              this.characters.addRange(0x2060, 0x2fff, characterSet);
              this.characters.addRange(0x3001, MAX_CODE_POINT, characterSet);
            } else {
              this.characters.addRange(this.codePoint(' ') + 1, MAX_CODE_POINT, characterSet);
            }
          } else {
            this.characters.addRange(this.codePoint('\t'), this.codePoint('\r'), characterSet);
            this.characters.addRange(this.codePoint(' '), this.codePoint(' '), characterSet);
            if (this.characters.flags.unicode) {
              this.characters.addRange(0x85, 0x85, characterSet);
              this.characters.addRange(0xa0, 0xa0, characterSet);
              this.characters.addRange(0x1680, 0x1680, characterSet);
              this.characters.addRange(0x2000, 0x200a, characterSet);
              this.characters.addRange(0x2028, 0x2029, characterSet);
              this.characters.addRange(0x202f, 0x202f, characterSet);
              this.characters.addRange(0x205f, 0x205f, characterSet);
              this.characters.addRange(0x3000, 0x3000, characterSet);
            }
          }
          break;
        case 'word':
          if (characterSet.negate) {
            this.characters.addRange(0x00, this.codePoint('0') - 1, characterSet);
            this.characters.addRange(
              this.codePoint('9') + 1,
              this.codePoint('A') - 1,
              characterSet,
            );
            this.characters.addRange(
              this.codePoint('Z') + 1,
              this.codePoint('_') - 1,
              characterSet,
            );
            this.characters.addRange(this.codePoint('`'), this.codePoint('`'), characterSet);
            if (this.characters.flags.unicode) {
              this.characters.addRange(
                this.codePoint('z') + 1,
                this.codePoint('µ') - 1,
                characterSet,
              );
            } else {
              this.characters.addRange(this.codePoint('z') + 1, MAX_CODE_POINT, characterSet);
            }
          } else {
            this.characters.addRange(this.codePoint('0'), this.codePoint('9'), characterSet);
            this.characters.addRange(this.codePoint('A'), this.codePoint('Z'), characterSet);
            this.characters.addRange(this.codePoint('_'), this.codePoint('_'), characterSet);
            this.characters.addRange(this.codePoint('a'), this.codePoint('z'), characterSet);
          }
          break;
      }
    };
    class_1.prototype.addRange = function (from, to, element) {
      var upperCaseFrom = this.codePoint(String.fromCodePoint(from).toUpperCase());
      var upperCaseTo = this.codePoint(String.fromCodePoint(to).toUpperCase());
      var lowerCaseFrom = this.codePoint(String.fromCodePoint(upperCaseFrom).toLowerCase());
      var lowerCaseTo = this.codePoint(String.fromCodePoint(upperCaseTo).toLowerCase());
      if (
        this.characters.flags.ignoreCase &&
        lowerCaseFrom !== upperCaseFrom &&
        lowerCaseTo !== upperCaseTo &&
        ((this.isAscii(from) && this.isAscii(to)) || this.characters.flags.unicode)
      ) {
        this.characters.addRange(upperCaseFrom, upperCaseTo, element);
        this.characters.addRange(lowerCaseFrom, lowerCaseTo, element);
      } else {
        this.characters.addRange(from, to, element);
      }
    };
    class_1.prototype.isAscii = function (c) {
      return c < 128;
    };
    class_1.prototype.codePoint = function (c) {
      var cp = c.codePointAt(0);
      if (cp === undefined) {
        throw new Error('failed to compute code point for: '.concat(c));
      }
      return cp;
    };
    return class_1;
  })();
  return SimplifiedRegexCharacterClass;
})();
exports.SimplifiedRegexCharacterClass = SimplifiedRegexCharacterClass;
