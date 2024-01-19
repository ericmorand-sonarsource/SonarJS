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
// https://sonarsource.github.io/rspec/#/rspec/S5732/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
var HELMET = 'helmet';
var HELMET_CSP = 'helmet-csp';
var DIRECTIVES = 'directives';
var NONE = "'none'";
var CONTENT_SECURITY_POLICY = 'contentSecurityPolicy';
var FRAME_ANCESTORS_CAMEL = 'frameAncestors';
var FRAME_ANCESTORS_HYPHEN = 'frame-ancestors';
exports.rule = helpers_1.Express.SensitiveMiddlewarePropertyRule(
  findDirectivesWithSensitiveFrameAncestorsPropertyFromHelmet,
  'Make sure disabling content security policy frame-ancestors directive is safe here.',
);
function findDirectivesWithSensitiveFrameAncestorsPropertyFromHelmet(context, node) {
  var args = node.arguments;
  if (isValidHelmetModuleCall(context, node) && args.length === 1) {
    var options = args[0];
    var maybeDirectives = (0, helpers_1.getObjectExpressionProperty)(options, DIRECTIVES);
    if (maybeDirectives) {
      var maybeFrameAncestors = getFrameAncestorsProperty(maybeDirectives);
      if (!maybeFrameAncestors) {
        return [maybeDirectives];
      }
      if (isSetNoneFrameAncestorsProperty(maybeFrameAncestors)) {
        return [maybeFrameAncestors];
      }
    }
  }
  return [];
}
function isValidHelmetModuleCall(context, callExpr) {
  /* csp(options) or helmet.contentSecurityPolicy(options) */
  var fqn = (0, helpers_1.getFullyQualifiedName)(context, callExpr);
  return fqn === HELMET_CSP || fqn === ''.concat(HELMET, '.').concat(CONTENT_SECURITY_POLICY);
}
function isSetNoneFrameAncestorsProperty(frameAncestors) {
  var value = frameAncestors.value;
  return (
    value.type === 'ArrayExpression' &&
    Boolean(
      value.elements.find(function (v) {
        return (
          (v === null || v === void 0 ? void 0 : v.type) === 'Literal' &&
          typeof v.value === 'string' &&
          v.value === NONE
        );
      }),
    )
  );
}
function getFrameAncestorsProperty(directives) {
  var propertyKeys = [FRAME_ANCESTORS_CAMEL, FRAME_ANCESTORS_HYPHEN];
  for (var _i = 0, propertyKeys_1 = propertyKeys; _i < propertyKeys_1.length; _i++) {
    var propertyKey = propertyKeys_1[_i];
    var maybeProperty = (0, helpers_1.getObjectExpressionProperty)(directives.value, propertyKey);
    if (maybeProperty) {
      return maybeProperty;
    }
  }
  return undefined;
}
