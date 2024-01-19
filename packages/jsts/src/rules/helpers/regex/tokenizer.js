'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.tokenizeString = void 0;
var UNICODE_ESCAPE_LENGTH = 4;
var HEX_ESCAPE_LENGTH = 2;
var CP_BACK_SLASH = cp('\\');
var CP_FORWARD_SLASH = cp('/');
var CP_CR = cp('\r');
var CP_LF = cp('\n');
var CP_n = cp('n');
var CP_r = cp('r');
var CP_t = cp('t');
var CP_b = cp('b');
var CP_v = cp('v');
var CP_f = cp('f');
var CP_u = cp('u');
var CP_x = cp('x');
/**
 * Parse 's' and return array of tokens with range. We assume 's' is correctly terminated because it was already parsed
 * into AST.
 *
 * Inspired by https://github.com/ota-meshi/eslint-plugin-regexp/blob/61ae9424e0f3bde62569718b597cdc036fec9f71/lib/utils/string-literal-parser/tokenizer.ts
 */
function tokenizeString(s) {
  var tokens = [];
  var pos = 0;
  function next() {
    var c = cp(s, pos);
    pos = inc(pos, c);
    return c;
  }
  function readEscape() {
    var c = next();
    switch (c) {
      case CP_n:
        return '\n';
      case CP_r:
        return '\r';
      case CP_t:
        return '\t';
      case CP_b:
        return '\b';
      case CP_v:
        return '\v';
      case CP_f:
        return '\f';
      case CP_BACK_SLASH:
        return '\\';
      case CP_CR:
        if (cp(s, pos) === CP_LF) {
          pos++; // \r\n
        }
        return '';
      case CP_LF:
        return '';
      case CP_u:
        return String.fromCodePoint(readUnicode());
      case CP_x:
        return String.fromCodePoint(readHex());
      default:
        if (isOctalDigit(c)) {
          return readOctal(c);
        }
        return String.fromCodePoint(c);
    }
  }
  /**
   * read unicode escape like \u0061 or \u{61}
   */
  function readUnicode() {
    var u;
    if (s.charAt(pos) === '{') {
      pos++;
      var close_1 = s.indexOf('}', pos);
      u = s.substring(pos, close_1);
      pos = close_1 + 1;
    } else {
      u = s.substring(pos, pos + UNICODE_ESCAPE_LENGTH);
      pos += UNICODE_ESCAPE_LENGTH;
    }
    return Number.parseInt(u, 16);
  }
  /**
   * read hex escape like \xA9
   */
  function readHex() {
    var x = Number.parseInt(s.substring(pos, pos + HEX_ESCAPE_LENGTH), 16);
    pos += HEX_ESCAPE_LENGTH;
    return x;
  }
  /**
   * read octal escapes like \251. Octal escape sequences can have 1 - 3 digits
   * and can be padded with 0
   *
   * @param firstDigit digit on the current 'pos' position
   */
  function readOctal(firstDigit) {
    var octal = String.fromCodePoint(firstDigit);
    var i = pos;
    while (isOctalDigit(cp(s, i)) && i - pos < 2) {
      octal += s.charAt(i);
      i++;
    }
    var res = Number.parseInt(octal, 8);
    pos = i;
    return String.fromCodePoint(res);
  }
  while (pos < s.length) {
    var start = pos;
    var c = next();
    if (c === CP_BACK_SLASH) {
      var value = readEscape();
      if (value !== '') {
        tokens.push({ value: value, range: [start, pos] });
      }
    } else if (c === CP_FORWARD_SLASH) {
      var forwardSlash = {
        value: String.fromCodePoint(c),
        range: [start, pos],
      };
      tokens.push(forwardSlash);
      tokens.push(forwardSlash);
    } else {
      tokens.push({ value: String.fromCodePoint(c), range: [start, pos] });
    }
  }
  return tokens;
}
exports.tokenizeString = tokenizeString;
function inc(pos, c) {
  // account for UTF-16 low surrogate
  return pos + (c >= 0x10000 ? 2 : 1);
}
function isOctalDigit(c) {
  return c !== undefined && cp('0') <= c && c <= cp('7');
}
function cp(s, i) {
  if (i === void 0) {
    i = 0;
  }
  return s.codePointAt(i);
}
