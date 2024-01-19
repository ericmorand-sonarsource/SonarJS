'use strict';
var __spreadArray =
  (this && this.__spreadArray) ||
  function (to, from, pack) {
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from));
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.findNcloc = void 0;
var helpers_1 = require('./helpers');
/**
 * Finds the line numbers of code (ncloc)
 *
 * The line numbers of code denote physical lines that contain at least
 * one character which is neither a whitespace nor a tabulation nor part
 * of a comment.
 *
 * @param sourceCode the ESLint source code
 * @returns the line numbers of code
 */
function findNcloc(sourceCode) {
  var _a;
  var lines = new Set();
  var ast = sourceCode.ast;
  var tokens = __spreadArray([], (_a = ast.tokens) !== null && _a !== void 0 ? _a : [], true);
  if (ast.templateBody) {
    tokens.push.apply(tokens, extractVuejsTokens(ast.templateBody));
  }
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    (0, helpers_1.addLines)(token.loc.start.line, token.loc.end.line, lines);
  }
  return Array.from(lines).sort(function (a, b) {
    return a - b;
  });
}
exports.findNcloc = findNcloc;
/**
 * Extracts Vue.js-specific tokens
 *
 * The template section parsed by `vue-eslint-parser` includes tokens for the whole `.vue` file.
 * Everything that is not template-related is either raw text or whitespace. Although the style
 * section is not parsed, its tokens are made available. Therefore, in addition to the tokens of
 * the script section, we consider tokens from the template and style sections as well, provided
 * that they don't denote whitespace or comments.
 */
function extractVuejsTokens(templateBody) {
  var tokens = [];
  var withinStyle = false;
  var withinComment = false;
  for (var _i = 0, _a = templateBody.tokens; _i < _a.length; _i++) {
    var token = _a[_i];
    /**
     * Style section
     */
    if (token.type === 'HTMLTagOpen' && token.value === 'style') {
      withinStyle = true;
    } else if (token.type === 'HTMLEndTagOpen' && token.value === 'style') {
      withinStyle = false;
    }
    /**
     * Whitespace tokens should be ignored in accordance with the
     * definition of ncloc.
     */
    if (token.type === 'HTMLWhitespace') {
      continue;
    }
    /**
     * Tokens of type 'HTMLRawText' denote either tokens from the
     * style section or tokens from the script section. Since the
     * tokens from the script section are already retrieved from
     * the root of the ast, we ignore those and only consider the
     * tokens from the style section.
     */
    if (token.type === 'HTMLRawText' && !withinStyle) {
      continue;
    }
    /**
     * CSS comment tokens should be ignored in accordance with the
     * definition of ncloc.
     */
    if (withinStyle && !withinComment && token.value === '/*') {
      withinComment = true;
      continue;
    } else if (withinStyle && withinComment) {
      withinComment = token.value !== '*/';
      continue;
    }
    tokens.push(token);
  }
  return tokens;
}
