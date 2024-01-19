'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.findCommentLines = void 0;
var helpers_1 = require('./helpers');
/**
 * A comment marker to tell SonarQube to ignore any issue on the same line
 * as the one with a comment whose text is `NOSONAR` (case-insensitive).
 */
var NOSONAR = 'NOSONAR';
/**
 * Finds the line numbers of comments in the source code
 * @param sourceCode the source code to visit
 * @param ignoreHeaderComments a flag to ignore file header comments
 * @returns the line numbers of comments
 */
function findCommentLines(sourceCode, ignoreHeaderComments) {
  var commentLines = new Set();
  var nosonarLines = new Set();
  var comments = sourceCode.ast.comments;
  // ignore header comments -> comments before first token
  var firstToken = sourceCode.getFirstToken(sourceCode.ast);
  if (firstToken && ignoreHeaderComments) {
    var header = sourceCode.getCommentsBefore(firstToken);
    comments = comments.slice(header.length);
  }
  for (var _i = 0, comments_1 = comments; _i < comments_1.length; _i++) {
    var comment = comments_1[_i];
    if (comment.loc) {
      var commentValue = comment.value.startsWith('*')
        ? comment.value.substring(1).trim()
        : comment.value.trim();
      if (commentValue.toUpperCase().startsWith(NOSONAR)) {
        (0, helpers_1.addLines)(comment.loc.start.line, comment.loc.end.line, nosonarLines);
      } else if (commentValue.length > 0) {
        (0, helpers_1.addLines)(comment.loc.start.line, comment.loc.end.line, commentLines);
      }
    }
  }
  return {
    commentLines: Array.from(commentLines).sort(function (a, b) {
      return a - b;
    }),
    nosonarLines: Array.from(nosonarLines).sort(function (a, b) {
      return a - b;
    }),
  };
}
exports.findCommentLines = findCommentLines;
