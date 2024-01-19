'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.getSyntaxHighlighting = void 0;
var helpers_1 = require('./metrics/helpers');
/**
 * Computes the syntax highlighting of an ESLint source code
 * @param sourceCode the source code to highlight
 * @returns a list of highlighted tokens
 */
function getSyntaxHighlighting(sourceCode) {
  var _a = (0, helpers_1.extractTokensAndComments)(sourceCode),
    tokens = _a.tokens,
    comments = _a.comments;
  var highlights = [];
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    switch (token.type) {
      case 'HTMLTagOpen':
      case 'HTMLTagClose':
      case 'HTMLEndTagOpen':
      case 'HTMLSelfClosingTagClose':
      case 'Keyword':
        highlight(token, 'KEYWORD', highlights);
        break;
      case 'HTMLLiteral':
      case 'String':
      case 'Template':
      case 'RegularExpression':
        highlight(token, 'STRING', highlights);
        break;
      case 'Numeric':
        highlight(token, 'CONSTANT', highlights);
        break;
      case 'Identifier': {
        var node = sourceCode.getNodeByRangeIndex(token.range[0]);
        // @ts-ignore
        if (
          token.value === 'type' &&
          (node === null || node === void 0 ? void 0 : node.type) === 'TSTypeAliasDeclaration'
        ) {
          highlight(token, 'KEYWORD', highlights);
        }
        // @ts-ignore
        if (
          token.value === 'as' &&
          (node === null || node === void 0 ? void 0 : node.type) === 'TSAsExpression'
        ) {
          highlight(token, 'KEYWORD', highlights);
        }
        break;
      }
    }
  }
  for (var _b = 0, comments_1 = comments; _b < comments_1.length; _b++) {
    var comment = comments_1[_b];
    if (
      (comment.type === 'Block' && comment.value.startsWith('*')) ||
      comment.type === 'HTMLBogusComment'
    ) {
      highlight(comment, 'STRUCTURED_COMMENT', highlights);
    } else {
      highlight(comment, 'COMMENT', highlights);
    }
  }
  return { highlights: highlights };
}
exports.getSyntaxHighlighting = getSyntaxHighlighting;
function highlight(node, highlightKind, highlights) {
  if (!node.loc) {
    return;
  }
  var startPosition = node.loc.start;
  var endPosition = node.loc.end;
  highlights.push({
    location: {
      startLine: startPosition.line,
      startCol: startPosition.column,
      endLine: endPosition.line,
      endCol: endPosition.column,
    },
    textType: highlightKind,
  });
}
