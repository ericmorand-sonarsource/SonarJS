'use strict';
/*
 * SonarQube JavaScript Plugin
 * Copyright (C) 2011-2024 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
// https://sonarsource.github.io/rspec/#/rspec/S5736/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
var HELMET = 'helmet';
var POLICY = 'policy';
var REFERRER_POLICY = 'referrerPolicy';
var UNSAFE_REFERRER_POLICY_VALUES = ['', 'unsafe-url', 'no-referrer-when-downgrade'];
exports.rule = helpers_1.Express.SensitiveMiddlewarePropertyRule(
  findNoReferrerPolicyPropertyFromHelmet,
  'Make sure disabling strict HTTP no-referrer policy is safe here.',
);
function findNoReferrerPolicyPropertyFromHelmet(context, node) {
  var sensitive;
  var callee = node.callee,
    args = node.arguments;
  if (args.length === 1) {
    var options = args[0];
    /* helmet({ referrerPolicy: false }) or helmet.referrerPolicy({ policy: <unsafe_value> }) */
    var fqn = (0, helpers_1.getFullyQualifiedName)(context, callee);
    if (fqn === HELMET && options.type === 'ObjectExpression') {
      sensitive = (0, helpers_1.getPropertyWithValue)(context, options, REFERRER_POLICY, false);
    } else if (fqn === ''.concat(HELMET, '.').concat(REFERRER_POLICY)) {
      var maybePolicy = (0, helpers_1.getObjectExpressionProperty)(options, POLICY);
      if (maybePolicy && !isSafePolicy(maybePolicy)) {
        sensitive = maybePolicy;
      }
    }
  }
  return sensitive ? [sensitive] : [];
}
function isSafePolicy(policy) {
  var value = policy.value;
  var values = value.type === 'ArrayExpression' ? value.elements : [value];
  var sensitiveValue = values.find(function (v) {
    return (
      (v === null || v === void 0 ? void 0 : v.type) === 'Literal' &&
      typeof v.value === 'string' &&
      UNSAFE_REFERRER_POLICY_VALUES.includes(v.value)
    );
  });
  return !Boolean(sensitiveValue);
}
