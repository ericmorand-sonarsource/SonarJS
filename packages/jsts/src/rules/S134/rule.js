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
// https://sonarsource.github.io/rspec/#/rspec/S134/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
var parameters_1 = require('../../linter/parameters');
exports.rule = {
  meta: {
    schema: [
      { type: 'integer' },
      {
        // internal parameter for rules having secondary locations
        enum: [parameters_1.SONAR_RUNTIME],
      },
    ],
  },
  create: function (context) {
    var _a;
    var sourceCode = context.sourceCode;
    var threshold = context.options[0];
    var nodeStack = [];
    function push(n) {
      nodeStack.push(n);
    }
    function pop() {
      return nodeStack.pop();
    }
    function check(node) {
      if (nodeStack.length === threshold) {
        context.report({
          message: (0, helpers_1.toEncodedMessage)(
            'Refactor this code to not nest more than '.concat(
              threshold,
              ' if/for/while/switch/try statements.',
            ),
            nodeStack,
            nodeStack.map(function (_n) {
              return '+1';
            }),
          ),
          loc: sourceCode.getFirstToken(node).loc,
        });
      }
    }
    function isElseIf(node) {
      var parent = (0, helpers_1.last)(context.getAncestors());
      return (
        node.type === 'IfStatement' && parent.type === 'IfStatement' && node === parent.alternate
      );
    }
    var controlFlowNodes = [
      'ForStatement',
      'ForInStatement',
      'ForOfStatement',
      'WhileStatement',
      'DoWhileStatement',
      'IfStatement',
      'TryStatement',
      'SwitchStatement',
    ].join(',');
    return (
      (_a = {}),
      (_a[controlFlowNodes] = function (node) {
        if (isElseIf(node)) {
          pop();
          push(sourceCode.getFirstToken(node));
        } else {
          check(node);
          push(sourceCode.getFirstToken(node));
        }
      }),
      (_a[''.concat(controlFlowNodes, ':exit')] = function (node) {
        if (!isElseIf(node)) {
          pop();
        }
      }),
      _a
    );
  },
};
