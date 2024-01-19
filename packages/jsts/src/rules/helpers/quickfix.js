'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.removeNodeWithLeadingWhitespaces = void 0;
function removeNodeWithLeadingWhitespaces(context, node, fixer, removeUntil) {
  var previousComments = context.sourceCode.getCommentsBefore(node);
  var start = 0;
  if (previousComments.length === 0) {
    var previousToken = context.sourceCode.getTokenBefore(node);
    if (previousToken) {
      start = previousToken.range[1];
    }
  } else {
    start = previousComments[previousComments.length - 1].range[1];
  }
  var end = removeUntil !== null && removeUntil !== void 0 ? removeUntil : node.range[1];
  return fixer.removeRange([start, end]);
}
exports.removeNodeWithLeadingWhitespaces = removeNodeWithLeadingWhitespaces;
