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
// https://sonarsource.github.io/rspec/#/rspec/S109/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var typescript_eslint_1 = require('../typescript-eslint');
var helpers_1 = require('../helpers');
exports.rule = {
  meta: {
    messages: {
      noMagic: 'No magic number: {{raw}}.',
    },
  },
  create: function (context) {
    var baseRule = typescript_eslint_1.tsEslintRules['no-magic-numbers'].create(context);
    return {
      Literal: function (node) {
        if (!isNumericLiteral(node)) {
          return;
        }
        var numericLiteral = getNumericLiteral(node);
        if (!numericLiteral) {
          return;
        }
        var value = numericLiteral.value,
          parent = numericLiteral.parent;
        if (
          isPower(value) ||
          isJSX(context) ||
          isBitwiseOperator(parent) ||
          isJsonStringify(parent)
        ) {
          return;
        }
        // Delegate to the typescript-eslint rule
        // @ts-ignore
        baseRule.Literal(node);
      },
    };
  },
};
function getNumericLiteral(node) {
  var _a;
  // Literal or UnaryExpression
  var numberNode;
  var raw;
  var value = numericLiteralValue(node);
  var parent = (0, helpers_1.getNodeParent)(node);
  if (!parent || !value) {
    return undefined;
  }
  // Treat unary minus as a part of the number
  if (parent.type === 'UnaryExpression' && parent.operator === '-') {
    numberNode = parent;
    parent = (0, helpers_1.getNodeParent)(parent);
    value = -value;
    raw = '-'.concat(node.raw);
  } else {
    numberNode = node;
    raw = (_a = node.raw) !== null && _a !== void 0 ? _a : '';
  }
  return { numberNode: numberNode, raw: raw, value: value, parent: parent };
}
function numericLiteralValue(node) {
  if (typeof node.value === 'number') {
    return node.value;
  }
}
function isNumericLiteral(node) {
  return (
    node.type === 'Literal' && (typeof node.value === 'number' || typeof node.value === 'bigint')
  );
}
function isPower(value) {
  return Number.isInteger(Math.log10(value)) || Number.isInteger(Math.log2(value));
}
function isJSX(context) {
  return context.getAncestors().some(function (node) {
    return node.type.startsWith('JSX');
  });
}
function isBitwiseOperator(node) {
  return (
    node.type === 'BinaryExpression' && ['&', '|', '^', '<<', '>>', '>>>'].includes(node.operator)
  );
}
function isJsonStringify(node) {
  return (
    node.type === 'CallExpression' &&
    (0, helpers_1.isMethodInvocation)(node, 'JSON', 'stringify', 3)
  );
}
