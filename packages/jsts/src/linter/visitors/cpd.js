'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.getCpdTokens = void 0;
var visitor_1 = require('./visitor');
/**
 * Extracts the copy-paste detector (cpd) tokens
 * @param sourceCode the source code to extract from
 * @returns the cpd tokens
 */
function getCpdTokens(sourceCode) {
  var cpdTokens = [];
  var tokens = sourceCode.ast.tokens;
  var _a = extractTokens(sourceCode),
    jsxTokens = _a.jsxTokens,
    importTokens = _a.importTokens,
    requireTokens = _a.requireTokens;
  tokens.forEach(function (token) {
    var text = token.value;
    if (text.trim().length === 0) {
      // for EndOfFileToken and JsxText tokens containing only whitespaces
      return;
    }
    if (importTokens.includes(token)) {
      // for tokens from import statements
      return;
    }
    if (requireTokens.includes(token)) {
      // for tokens from require statements
      return;
    }
    if (isStringLiteralToken(token) && !jsxTokens.includes(token)) {
      text = 'LITERAL';
    }
    var startPosition = token.loc.start;
    var endPosition = token.loc.end;
    cpdTokens.push({
      location: {
        startLine: startPosition.line,
        startCol: startPosition.column,
        endLine: endPosition.line,
        endCol: endPosition.column,
      },
      image: text,
    });
  });
  return { cpdTokens: cpdTokens };
}
exports.getCpdTokens = getCpdTokens;
/**
 * Extracts specific tokens to be ignored by copy-paste detection
 * @param sourceCode the source code to extract from
 * @returns a list of tokens to be ignored
 */
function extractTokens(sourceCode) {
  var jsxTokens = [];
  var importTokens = [];
  var requireTokens = [];
  (0, visitor_1.visit)(sourceCode, function (node) {
    var _a;
    var tsNode = node;
    switch (tsNode.type) {
      case 'JSXAttribute':
        if (((_a = tsNode.value) === null || _a === void 0 ? void 0 : _a.type) === 'Literal') {
          jsxTokens.push.apply(jsxTokens, sourceCode.getTokens(tsNode.value));
        }
        break;
      case 'ImportDeclaration':
        importTokens.push.apply(importTokens, sourceCode.getTokens(tsNode));
        break;
      case 'CallExpression':
        if (tsNode.callee.type === 'Identifier' && tsNode.callee.name === 'require') {
          requireTokens.push.apply(requireTokens, sourceCode.getTokens(tsNode));
        }
        break;
    }
  });
  return { jsxTokens: jsxTokens, importTokens: importTokens, requireTokens: requireTokens };
}
function isStringLiteralToken(token) {
  return token.value.startsWith('"') || token.value.startsWith("'") || token.value.startsWith('`');
}
