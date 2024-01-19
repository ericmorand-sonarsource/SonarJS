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
// https://sonarsource.github.io/rspec/#/rspec/S5148/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
var REQUIRED_OPTION = 'noopener';
var REQUIRED_OPTION_INDEX = 2;
var URL_INDEX = 0;
exports.rule = {
  meta: {
    messages: {
      missingNoopener: 'Make sure not using "noopener" is safe here.',
    },
  },
  create: function (context) {
    return {
      CallExpression: function (node) {
        if (!(0, helpers_1.isMethodCall)(node)) {
          return;
        }
        var _a = node.callee,
          object = _a.object,
          property = _a.property;
        var isWindowOpen =
          (0, helpers_1.isIdentifier)(property, 'open') &&
          ((0, helpers_1.isIdentifier)(object, 'window') || isThisWindow(object));
        if (!isWindowOpen) {
          return;
        }
        var args = node.arguments;
        var hasHttpUrl = URL_INDEX < args.length && isHttpUrl(context, args[URL_INDEX]);
        if (!hasHttpUrl) {
          return;
        }
        if (
          args.length <= REQUIRED_OPTION_INDEX ||
          !hasRequiredOption(context, args[REQUIRED_OPTION_INDEX])
        ) {
          context.report({
            messageId: 'missingNoopener',
            node: property,
          });
        }
      },
    };
  },
};
function isThisWindow(node) {
  return (
    node.type === 'MemberExpression' &&
    node.object.type === 'ThisExpression' &&
    (0, helpers_1.isIdentifier)(node.property, 'window')
  );
}
function hasRequiredOption(context, argument) {
  var stringOrNothing = extractString(context, argument);
  return stringOrNothing === null || stringOrNothing === void 0
    ? void 0
    : stringOrNothing.includes(REQUIRED_OPTION);
}
function isHttpUrl(context, argument) {
  var stringOrNothing = extractString(context, argument);
  return (
    stringOrNothing !== undefined &&
    (stringOrNothing.startsWith('http://') || stringOrNothing.startsWith('https://'))
  );
}
function extractString(context, node) {
  var literalNodeOrNothing = (0, helpers_1.getValueOfExpression)(context, node, 'Literal');
  if (literalNodeOrNothing === undefined || !(0, helpers_1.isStringLiteral)(literalNodeOrNothing)) {
    return undefined;
  } else {
    return literalNodeOrNothing.value;
  }
}
