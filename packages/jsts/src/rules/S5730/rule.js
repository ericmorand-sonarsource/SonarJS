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
// https://sonarsource.github.io/rspec/#/rspec/S5730/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
var HELMET = 'helmet';
var HELMET_CSP = 'helmet-csp';
var DIRECTIVES = 'directives';
var CONTENT_SECURITY_POLICY = 'contentSecurityPolicy';
var BLOCK_ALL_MIXED_CONTENT_CAMEL = 'blockAllMixedContent';
var BLOCK_ALL_MIXED_CONTENT_HYPHEN = 'block-all-mixed-content';
exports.rule = helpers_1.Express.SensitiveMiddlewarePropertyRule(
  findDirectivesWithMissingMixedContentPropertyFromHelmet,
  'Make sure allowing mixed-content is safe here.',
);
function findDirectivesWithMissingMixedContentPropertyFromHelmet(context, node) {
  var sensitive;
  var args = node.arguments;
  if (args.length === 1) {
    var options = args[0];
    var maybeDirectives = (0, helpers_1.getObjectExpressionProperty)(options, DIRECTIVES);
    if (
      maybeDirectives &&
      isMissingMixedContentProperty(maybeDirectives) &&
      isValidHelmetModuleCall(context, node)
    ) {
      sensitive = maybeDirectives;
    }
  }
  return sensitive ? [sensitive] : [];
}
function isValidHelmetModuleCall(context, callExpr) {
  var fqn = (0, helpers_1.getFullyQualifiedName)(context, callExpr);
  return fqn === ''.concat(HELMET, '.').concat(CONTENT_SECURITY_POLICY) || fqn === HELMET_CSP;
}
function isMissingMixedContentProperty(directives) {
  return !(
    Boolean(
      (0, helpers_1.getObjectExpressionProperty)(directives.value, BLOCK_ALL_MIXED_CONTENT_CAMEL),
    ) ||
    Boolean(
      (0, helpers_1.getObjectExpressionProperty)(directives.value, BLOCK_ALL_MIXED_CONTENT_HYPHEN),
    )
  );
}
