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
// https://sonarsource.github.io/rspec/#/rspec/S128/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
exports.rule = {
  meta: {
    messages: {
      switchEnd:
        'End this switch case with an unconditional break, continue, return or throw statement.',
    },
  },
  create: function (context) {
    var currentCodePath = null;
    var currentCodeSegment = null;
    var enteringSwitchCase = false;
    var segmentsWithExit = new Set();
    var initialSegmentBySwitchCase = new Map();
    var switchCaseStack = [];
    function noComment(node) {
      return context.sourceCode.getCommentsAfter(node).length === 0;
    }
    function isAfterProcessExitCall(segment, initialSegment) {
      var stack = [];
      var visitedSegments = new Set();
      stack.push(segment);
      while (stack.length !== 0) {
        var current = stack.pop();
        visitedSegments.add(current.id);
        if (!segmentsWithExit.has(current.id)) {
          if (current === initialSegment) {
            return false;
          }
          current.prevSegments
            .filter(function (p) {
              return !visitedSegments.has(p.id);
            })
            .forEach(function (p) {
              return stack.push(p);
            });
        }
      }
      return true;
    }
    return {
      onCodePathStart: function (codePath) {
        currentCodePath = codePath;
      },
      onCodePathEnd: function () {
        currentCodePath = currentCodePath.upper;
      },
      onCodePathSegmentStart: function (segment) {
        currentCodeSegment = segment;
        if (enteringSwitchCase) {
          initialSegmentBySwitchCase.set(switchCaseStack.pop(), currentCodeSegment);
          enteringSwitchCase = false;
        }
      },
      CallExpression: function (node) {
        var callExpr = node;
        if (isProcessExitCall(callExpr)) {
          segmentsWithExit.add(currentCodeSegment.id);
        }
      },
      SwitchCase: function (node) {
        enteringSwitchCase = true;
        switchCaseStack.push(node);
      },
      'SwitchCase:exit': function (node) {
        var switchCase = node;
        var initialSegment = initialSegmentBySwitchCase.get(switchCase);
        var isReachable = currentCodePath.currentSegments.some(function (s) {
          return s.reachable && !isAfterProcessExitCall(s, initialSegment);
        });
        var cases = (0, helpers_1.getParent)(context).cases;
        if (
          isReachable &&
          switchCase.consequent.length > 0 &&
          cases[cases.length - 1] !== node &&
          noComment(switchCase)
        ) {
          context.report({
            messageId: 'switchEnd',
            loc: context.sourceCode.getFirstToken(node).loc,
          });
        }
      },
    };
  },
};
function isProcessExitCall(callExpr) {
  return (
    callExpr.callee.type === 'MemberExpression' &&
    callExpr.callee.object.type === 'Identifier' &&
    callExpr.callee.object.name === 'process' &&
    callExpr.callee.property.type === 'Identifier' &&
    callExpr.callee.property.name === 'exit'
  );
}
