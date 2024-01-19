'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.getRegexpLocation = void 0;
var __1 = require('../');
var range_1 = require('./range');
/**
 * Gets the regexp node location in the ESLint referential
 * @param node the ESLint regex node
 * @param regexpNode the regexp regex node
 * @param context the rule context
 * @param offset an offset to apply on the location
 * @returns the regexp node location in the ESLint referential
 */
function getRegexpLocation(node, regexpNode, context, offset) {
  if (offset === void 0) {
    offset = [0, 0];
  }
  var loc;
  if ((0, __1.isRegexLiteral)(node) || (0, __1.isStringLiteral)(node)) {
    var source = context.sourceCode;
    var start = node.range[0];
    var _a = (0, range_1.getRegexpRange)(node, regexpNode),
      reStart = _a[0],
      reEnd = _a[1];
    var locationStart = start + reStart + offset[0];
    var locationEnd = start + reEnd + offset[1];
    if (locationStart === locationEnd) {
      return null;
    } else {
      loc = {
        start: source.getLocFromIndex(locationStart),
        end: source.getLocFromIndex(locationEnd),
      };
    }
  } else {
    loc = node.loc;
  }
  return loc;
}
exports.getRegexpLocation = getRegexpLocation;
