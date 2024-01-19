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
// https://sonarsource.github.io/rspec/#/rspec/S5734/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
var HSTS = 'hsts';
var HELMET = 'helmet';
var MAX_AGE = 'maxAge';
var INCLUDE_SUB_DOMAINS = 'includeSubDomains';
var RECOMMENDED_MAX_AGE = 15552000;
exports.rule = helpers_1.Express.SensitiveMiddlewarePropertyRule(
  findSensitiveTransportSecurityPolicyProperty,
  'Disabling Strict-Transport-Security policy is security-sensitive.',
);
function findSensitiveTransportSecurityPolicyProperty(context, node) {
  var sensitiveFinders = [findSensitiveHsts, findSensitiveMaxAge, findSensitiveIncludeSubDomains];
  var sensitives = [];
  var callee = node.callee,
    args = node.arguments;
  if (args.length === 1 && args[0].type === 'ObjectExpression') {
    var options = args[0];
    for (var _i = 0, sensitiveFinders_1 = sensitiveFinders; _i < sensitiveFinders_1.length; _i++) {
      var finder = sensitiveFinders_1[_i];
      var maybeSensitive = finder(context, callee, options);
      if (maybeSensitive) {
        sensitives.push(maybeSensitive);
      }
    }
  }
  return sensitives;
}
function findSensitiveHsts(context, middleware, options) {
  if ((0, helpers_1.getFullyQualifiedName)(context, middleware) === HELMET) {
    return (0, helpers_1.getPropertyWithValue)(context, options, HSTS, false);
  }
  return undefined;
}
function findSensitiveMaxAge(context, middleware, options) {
  if (isHstsMiddlewareNode(context, middleware)) {
    var maybeMaxAgeProperty = (0, helpers_1.getObjectExpressionProperty)(options, MAX_AGE);
    if (maybeMaxAgeProperty) {
      var maybeMaxAgeValue = (0, helpers_1.getValueOfExpression)(
        context,
        maybeMaxAgeProperty.value,
        'Literal',
      );
      if (
        typeof (maybeMaxAgeValue === null || maybeMaxAgeValue === void 0
          ? void 0
          : maybeMaxAgeValue.value) === 'number' &&
        maybeMaxAgeValue.value < RECOMMENDED_MAX_AGE
      ) {
        return maybeMaxAgeProperty;
      }
    }
  }
  return undefined;
}
function findSensitiveIncludeSubDomains(context, middleware, options) {
  if (isHstsMiddlewareNode(context, middleware)) {
    return (0, helpers_1.getPropertyWithValue)(context, options, INCLUDE_SUB_DOMAINS, false);
  }
  return undefined;
}
function isHstsMiddlewareNode(context, node) {
  var fqn = (0, helpers_1.getFullyQualifiedName)(context, node);
  return fqn === ''.concat(HELMET, '.').concat(HSTS) || fqn === HSTS;
}
