'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.tsEslintRules = void 0;
var eslint_plugin_1 = require('@typescript-eslint/eslint-plugin');
var sanitize_1 = require('./sanitize');
/**
 * TypeScript ESLint rules that rely on type information fail at runtime because
 * they unconditionally assume that TypeScript's type checker is available.
 */
var sanitized = {};
for (var _i = 0, _a = Object.keys(eslint_plugin_1.rules); _i < _a.length; _i++) {
  var ruleKey = _a[_i];
  sanitized[ruleKey] = (0, sanitize_1.sanitize)(eslint_plugin_1.rules[ruleKey]);
}
/**
 * TypeScript ESLint rules.
 */
exports.tsEslintRules = sanitized;
