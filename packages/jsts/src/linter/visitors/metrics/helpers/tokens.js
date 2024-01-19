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
exports.extractTokensAndComments = void 0;
/**
 * Extracts comments and tokens from an ESLint source code
 *
 * The returned extracted comments includes also those from
 * the template section of a Vue.js Single File Component.
 *
 * @param sourceCode the source code to extract from
 * @returns the extracted tokens and comments
 */
function extractTokensAndComments(sourceCode) {
  var _a, _b;
  var ast = sourceCode.ast;
  var tokens = __spreadArray([], (_a = ast.tokens) !== null && _a !== void 0 ? _a : [], true);
  var comments = __spreadArray([], (_b = ast.comments) !== null && _b !== void 0 ? _b : [], true);
  if (ast.templateBody) {
    var templateBody = ast.templateBody;
    tokens.push.apply(tokens, templateBody.tokens);
    comments.push.apply(comments, templateBody.comments);
  }
  return { tokens: tokens, comments: comments };
}
exports.extractTokensAndComments = extractTokensAndComments;
