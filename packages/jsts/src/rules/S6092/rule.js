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
// https://sonarsource.github.io/rspec/#/rspec/S6092/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
var message = 'Refactor this uncertain assertion; it can succeed for multiple reasons.';
exports.rule = {
  create: function (context) {
    if (!helpers_1.Chai.isImported(context)) {
      return {};
    }
    return {
      ExpressionStatement: function (node) {
        var elements = retrieveAssertionChainElements(node.expression);
        if (
          elements.length > 1 &&
          ((0, helpers_1.isIdentifier)(elements[0].identifier, 'expect') ||
            getElementIndex(elements, 'should') >= 0)
        ) {
          checkNotThrow(context, elements);
          checkNotInclude(context, elements);
          checkNotHaveProperty(context, elements);
          checkNotHaveOwnPropertyDescriptor(context, elements);
          checkNotHaveMembers(context, elements);
          checkChangeBy(context, elements);
          checkNotIncDec(context, elements);
          checkNotBy(context, elements);
          checkNotFinite(context, elements);
        }
      },
    };
  },
};
function checkNotThrow(context, elements) {
  checkWithCondition(context, elements, 'not', 'throw', function (args) {
    return !!args && args.length > 0;
  });
}
function checkNotInclude(context, elements) {
  checkWithCondition(context, elements, 'not', 'include', function (args) {
    return !!args && args.length > 0 && args[0].type === 'ObjectExpression';
  });
}
function checkNotHaveProperty(context, elements) {
  checkWithCondition(context, elements, 'not', 'property', function (args) {
    return !!args && args.length > 1;
  });
}
function checkNotHaveOwnPropertyDescriptor(context, elements) {
  checkWithCondition(context, elements, 'not', 'ownPropertyDescriptor', function (args) {
    return !!args && args.length > 1;
  });
}
function checkNotHaveMembers(context, elements) {
  checkWithCondition(context, elements, 'not', 'members');
}
function checkChangeBy(context, elements) {
  checkWithCondition(context, elements, 'change', 'by');
}
function checkNotIncDec(context, elements) {
  checkWithCondition(context, elements, 'not', 'increase');
  checkWithCondition(context, elements, 'not', 'decrease');
}
function checkNotBy(context, elements) {
  checkWithCondition(context, elements, 'not', 'by');
}
function checkNotFinite(context, elements) {
  checkWithCondition(context, elements, 'not', 'finite');
}
function checkWithCondition(context, elements, first, second, condition) {
  if (condition === void 0) {
    condition = function () {
      return true;
    };
  }
  var firstIndex = getElementIndex(elements, first);
  var firstElement = elements[firstIndex];
  var secondIndex = getElementIndex(elements, second);
  var secondElement = elements[secondIndex];
  if (
    firstElement &&
    secondElement &&
    neighborIndexes(firstIndex, secondIndex, elements) &&
    condition(secondElement.arguments)
  ) {
    context.report({
      message: message,
      loc: locFromTwoNodes(firstElement.identifier, secondElement.identifier),
    });
  }
}
// first element is not applied to second if between them function call (e.g. fist.foo().second())
function neighborIndexes(firstIndex, secondIndex, elements) {
  if (firstIndex === secondIndex - 2) {
    return !elements[firstIndex + 1].arguments;
  }
  return firstIndex === secondIndex - 1;
}
function retrieveAssertionChainElements(node) {
  var currentNode = node;
  var result = [];
  var currentArguments = undefined;
  while (true) {
    if ((0, helpers_1.isDotNotation)(currentNode)) {
      result.push({ identifier: currentNode.property, arguments: currentArguments });
      currentNode = currentNode.object;
      currentArguments = undefined;
    } else if (currentNode.type === 'CallExpression') {
      currentArguments = currentNode.arguments;
      currentNode = currentNode.callee;
    } else if ((0, helpers_1.isIdentifier)(currentNode)) {
      result.push({ identifier: currentNode, arguments: currentArguments });
      break;
    } else {
      break;
    }
  }
  return result.reverse();
}
function getElementIndex(elements, name) {
  return elements.findIndex(function (element) {
    return (0, helpers_1.isIdentifier)(element.identifier, name);
  });
}
function locFromTwoNodes(start, end) {
  return {
    start: start.loc.start,
    end: end.loc.end,
  };
}
