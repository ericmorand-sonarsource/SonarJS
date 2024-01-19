'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.getRuleSchema = void 0;
var src_1 = require('../../../../../shared/src');
/**
 * Extracts the schema of a rule
 * @param ruleModule the rule definition
 * @param ruleId the rule id
 * @returns the extracted rule schema, if any
 */
function getRuleSchema(ruleModule, ruleId) {
  var _a;
  if (!ruleModule) {
    (0, src_1.debug)('ruleModule not found for rule '.concat(ruleId));
    return undefined;
  }
  if (!((_a = ruleModule.meta) === null || _a === void 0 ? void 0 : _a.schema)) {
    return undefined;
  }
  var schema = ruleModule.meta.schema;
  return Array.isArray(schema) ? schema : [schema];
}
exports.getRuleSchema = getRuleSchema;
