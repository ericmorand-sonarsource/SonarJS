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
// https://sonarsource.github.io/rspec/#/rspec/S1994/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var equivalence_1 = require('eslint-plugin-sonarjs/lib/utils/equivalence');
var helpers_1 = require('../helpers');
var ForInfo = /** @class */ (function () {
  function ForInfo(forLoop) {
    this.forLoop = forLoop;
    this.updatedExpressions = [];
    this.testedExpressions = [];
  }
  return ForInfo;
})();
exports.rule = {
  meta: {
    messages: {
      misplacedCounter:
        'This loop\'s stop condition tests "{{test}}" but the incrementer updates "{{update}}".',
    },
  },
  create: function (context) {
    var forLoopStack = [];
    function join(expressions) {
      return expressions
        .map(function (expr) {
          return context.sourceCode.getText(expr);
        })
        .join(', ');
    }
    function isInsideUpdate(node) {
      return isInside(node, function (f) {
        return f.update;
      });
    }
    function isInsideTest(node) {
      return isInside(node, function (f) {
        return f.test;
      });
    }
    function isInside(node, getChild) {
      if (forLoopStack.length > 0) {
        var currentLoop = peekFor();
        var parentChain = context.getAncestors();
        parentChain.push(node);
        var forLoopChild_1 = getChild(currentLoop.forLoop);
        if (forLoopChild_1) {
          return parentChain.some(function (parentChainNode) {
            return forLoopChild_1 === parentChainNode;
          });
        }
      }
      return false;
    }
    function peekFor() {
      return forLoopStack[forLoopStack.length - 1];
    }
    return {
      ForStatement: function (node) {
        forLoopStack.push(new ForInfo(node));
      },
      'ForStatement:exit': function () {
        var forInfo = forLoopStack.pop();
        if (forInfo.updatedExpressions.length === 0 || !forInfo.forLoop.test) {
          return;
        }
        var hasIntersection = forInfo.testedExpressions.some(function (testedExpr) {
          return forInfo.updatedExpressions.some(function (updatedExpr) {
            return (0,
            equivalence_1.areEquivalent)(updatedExpr, testedExpr, context.getSourceCode());
          });
        });
        if (!hasIntersection) {
          context.report({
            loc: context.sourceCode.getFirstToken(forInfo.forLoop).loc,
            messageId: 'misplacedCounter',
            data: {
              test: join(forInfo.testedExpressions),
              update: join(forInfo.updatedExpressions),
            },
          });
        }
      },
      'ForStatement AssignmentExpression': function (node) {
        if (isInsideUpdate(node)) {
          var left = node.left;
          var assignedExpressions = [];
          computeAssignedExpressions(left, assignedExpressions);
          var updatedExpressions_1 = peekFor().updatedExpressions;
          assignedExpressions.forEach(function (ass) {
            return updatedExpressions_1.push(ass);
          });
        }
      },
      'ForStatement UpdateExpression': function (node) {
        if (isInsideUpdate(node)) {
          peekFor().updatedExpressions.push(node.argument);
        }
      },
      'ForStatement CallExpression': function (node) {
        if (!isInsideUpdate(node)) {
          return;
        }
        var callee = getCalleeObject(node);
        if (callee) {
          peekFor().updatedExpressions.push(callee);
        }
      },
      'ForStatement Identifier': function (node) {
        if (isInsideTest(node)) {
          var parent_1 = (0, helpers_1.getParent)(context);
          if (
            parent_1.type !== 'MemberExpression' ||
            parent_1.computed ||
            parent_1.object === node
          ) {
            peekFor().testedExpressions.push(node);
          }
        }
      },
      'ForStatement MemberExpression': function (node) {
        if (
          isInsideTest(node) &&
          (0, helpers_1.getParent)(context).type !== 'MemberExpression' &&
          (0, helpers_1.getParent)(context).type !== 'CallExpression'
        ) {
          peekFor().testedExpressions.push(node);
        }
      },
    };
  },
};
function getCalleeObject(node) {
  var callee = node.callee;
  while (callee.type === 'MemberExpression') {
    callee = callee.object;
  }
  if (callee.type === 'Identifier' && callee !== node.callee) {
    return callee;
  }
  return null;
}
function computeAssignedExpressions(node, assigned) {
  switch (node === null || node === void 0 ? void 0 : node.type) {
    case 'ArrayPattern':
      node.elements.forEach(function (element) {
        return computeAssignedExpressions(element, assigned);
      });
      break;
    case 'ObjectPattern':
      node.properties.forEach(function (property) {
        return computeAssignedExpressions(property, assigned);
      });
      break;
    case 'Property':
      computeAssignedExpressions(node.value, assigned);
      break;
    case 'AssignmentPattern':
      computeAssignedExpressions(node.left, assigned);
      break;
    default:
      assigned.push(node);
  }
}
