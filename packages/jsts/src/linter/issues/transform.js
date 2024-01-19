'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.transformMessages = void 0;
var decode_1 = require('./decode');
var message_1 = require('./message');
var extract_1 = require('./extract');
/**
 * Transforms ESLint messages into SonarQube issues
 *
 * The result of linting a source code requires post-linting transformations
 * to return SonarQube issues. These transformations include extracting ucfg
 * paths, decoding issues with secondary locations as well as converting
 * quick fixes.
 *
 * Besides issues, a few metrics are computed during linting in the form of
 * an internal custom rule execution, namely cognitive complexity and symbol
 * highlighting. These custom rules also produce issues that are extracted.
 *
 * Transforming an ESLint message into a SonarQube issue implies:
 * - extracting UCFG rule file paths
 * - converting ESLint messages into SonarQube issues
 * - converting ESLint fixes into SonarLint quick fixes
 * - decoding encoded secondary locations
 * - normalizing issue locations
 *
 * @param messages ESLint messages to transform
 * @param ctx contextual information
 * @returns the linting result
 */
function transformMessages(messages, ctx) {
  var issues = [];
  var ucfgPaths = [];
  for (var _i = 0, messages_1 = messages; _i < messages_1.length; _i++) {
    var message = messages_1[_i];
    if (message.ruleId === 'ucfg') {
      ucfgPaths.push(message.message);
    } else {
      var issue = (0, message_1.convertMessage)(ctx.sourceCode, message);
      if (issue !== null) {
        issue = normalizeLocation(
          (0, decode_1.decodeSonarRuntime)(ctx.rules.get(issue.ruleId), issue),
        );
        issues.push(issue);
      }
    }
  }
  var highlightedSymbols = (0, extract_1.extractHighlightedSymbols)(issues);
  var cognitiveComplexity = (0, extract_1.extractCognitiveComplexity)(issues);
  return {
    issues: issues,
    ucfgPaths: ucfgPaths,
    highlightedSymbols: highlightedSymbols,
    cognitiveComplexity: cognitiveComplexity,
  };
}
exports.transformMessages = transformMessages;
/**
 * Normalizes an issue location
 *
 * SonarQube uses 0-based column indexing when it comes to issue locations
 * while ESLint uses 1-based column indexing for message locations.
 *
 * @param issue the issue to normalize
 * @returns the normalized issue
 */
function normalizeLocation(issue) {
  issue.column -= 1;
  if (issue.endColumn) {
    issue.endColumn -= 1;
  }
  return issue;
}
