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
// https://sonarsource.github.io/rspec/#/rspec/S1854/javascript
var __spreadArray =
  (this && this.__spreadArray) ||
  function (to, from, pack) {
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from));
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
exports.rule = {
  meta: {
    messages: {
      removeAssignment: 'Remove this useless assignment to variable "{{variable}}".',
    },
  },
  create: function (context) {
    var codePathStack = [];
    var liveVariablesMap = new Map();
    var readVariables = new Set();
    // map from Variable to CodePath ids where variable is used
    var variableUsages = new Map();
    var referencesUsedInDestructuring = new Set();
    var destructuringStack = [];
    return {
      ':matches(AssignmentExpression, VariableDeclarator[init])': function (node) {
        pushAssignmentContext(node);
      },
      ':matches(AssignmentExpression, VariableDeclarator[init]):exit': function () {
        popAssignmentContext();
      },
      Identifier: function (node) {
        if (isEnumConstant()) {
          return;
        }
        checkIdentifierUsage(node);
      },
      JSXIdentifier: function (node) {
        checkIdentifierUsage(node);
      },
      ObjectPattern: function () {
        destructuringStack.push(new DestructuringContext());
      },
      'ObjectPattern > Property > Identifier': function (node) {
        var destructuring = peek(destructuringStack);
        var ref = resolveReference(node).ref;
        if (ref) {
          destructuring.references.push(ref);
        }
      },
      'ObjectPattern > :matches(RestElement, ExperimentalRestProperty)': function () {
        peek(destructuringStack).hasRest = true;
      },
      'ObjectPattern:exit': function () {
        var destructuring = destructuringStack.pop();
        if (destructuring === null || destructuring === void 0 ? void 0 : destructuring.hasRest) {
          destructuring.references.forEach(function (ref) {
            return referencesUsedInDestructuring.add(ref);
          });
        }
      },
      'Program:exit': function () {
        (0, helpers_1.lva)(liveVariablesMap);
        liveVariablesMap.forEach(function (lva) {
          checkSegment(lva);
          reportNeverReadVariables(lva);
        });
      },
      // CodePath events
      onCodePathSegmentStart: function (segment) {
        liveVariablesMap.set(segment.id, new helpers_1.LiveVariables(segment));
      },
      onCodePathStart: function (codePath) {
        pushContext(new CodePathContext(codePath));
      },
      onCodePathEnd: function () {
        popContext();
      },
    };
    function pushAssignmentContext(node) {
      peek(codePathStack).assignmentStack.push(new AssignmentContext(node));
    }
    function popAssignmentContext() {
      var assignment = peek(codePathStack).assignmentStack.pop();
      assignment.rhs.forEach(function (r) {
        return processReference(r);
      });
      assignment.lhs.forEach(function (r) {
        return processReference(r);
      });
    }
    function checkSegment(liveVariables) {
      var willBeRead = new Set(liveVariables.out);
      var references = __spreadArray([], liveVariables.references, true).reverse();
      references.forEach(function (ref) {
        var variable = ref.resolved;
        if (!variable) {
          return;
        }
        if (ref.isWrite()) {
          if (!willBeRead.has(variable) && shouldReport(ref)) {
            report(ref);
          }
          willBeRead.delete(variable);
        }
        if (ref.isRead()) {
          willBeRead.add(variable);
        }
      });
    }
    function reportNeverReadVariables(lva) {
      lva.references.forEach(function (ref) {
        if (shouldReportReference(ref) && !readVariables.has(ref.resolved)) {
          report(ref);
        }
      });
    }
    function shouldReport(ref) {
      var variable = ref.resolved;
      return (
        variable &&
        shouldReportReference(ref) &&
        !variableUsedOutsideOfCodePath(variable) &&
        readVariables.has(variable)
      );
    }
    function shouldReportReference(ref) {
      var variable = ref.resolved;
      return (
        variable &&
        isLocalVar(variable) &&
        !isReferenceWithBasicValue(ref) &&
        !isDefaultParameter(ref) &&
        !referencesUsedInDestructuring.has(ref) &&
        !variable.name.startsWith('_') &&
        !isIncrementOrDecrement(ref) &&
        !isNullAssignment(ref)
      );
    }
    function isIncrementOrDecrement(ref) {
      var parent = ref.identifier.parent;
      return parent && parent.type === 'UpdateExpression';
    }
    function isNullAssignment(ref) {
      var parent = ref.identifier.parent;
      return (
        parent &&
        parent.type === 'AssignmentExpression' &&
        (0, helpers_1.isNullLiteral)(parent.right)
      );
    }
    function isEnumConstant() {
      return context.getAncestors().some(function (n) {
        return n.type === 'TSEnumDeclaration';
      });
    }
    function isDefaultParameter(ref) {
      if (ref.identifier.type !== 'Identifier') {
        return false;
      }
      var parent = ref.identifier.parent;
      return parent && parent.type === 'AssignmentPattern';
    }
    function isLocalVar(variable) {
      // @ts-ignore
      var scope = variable.scope;
      var node = scope.block;
      return node.type !== 'Program' && node.type !== 'TSModuleDeclaration';
    }
    function variableUsedOutsideOfCodePath(variable) {
      return variableUsages.get(variable).size > 1;
    }
    function isReferenceWithBasicValue(ref) {
      return ref.init && ref.writeExpr && isBasicValue(ref.writeExpr);
    }
    function isBasicValue(node) {
      switch (node.type) {
        case 'Literal':
          return node.value === '' || [0, 1, null, true, false].includes(node.value);
        case 'Identifier':
          return node.name === 'undefined';
        case 'UnaryExpression':
          return isBasicValue(node.argument);
        case 'ObjectExpression':
          return node.properties.length === 0;
        case 'ArrayExpression':
          return node.elements.length === 0;
        default:
          return false;
      }
    }
    function report(ref) {
      context.report({
        messageId: 'removeAssignment',
        data: {
          variable: ref.identifier.name,
        },
        loc: ref.identifier.loc,
      });
    }
    function checkIdentifierUsage(node) {
      var _a = node.type === 'Identifier' ? resolveReference(node) : resolveJSXReference(node),
        ref = _a.ref,
        variable = _a.variable;
      if (ref) {
        processReference(ref);
        if (variable) {
          updateReadVariables(ref);
        }
      }
      if (variable) {
        updateVariableUsages(variable);
      }
    }
    function resolveJSXReference(node) {
      if (isJSXAttributeName(node)) {
        return {};
      }
      var jsxReference = new JSXReference(node, context.getScope());
      return { ref: jsxReference, variable: jsxReference.resolved };
    }
    function isJSXAttributeName(node) {
      var parent = node.parent;
      return parent && parent.type === 'JSXAttribute' && parent.name === node;
    }
    function processReference(ref) {
      var assignmentStack = peek(codePathStack).assignmentStack;
      if (assignmentStack.length > 0) {
        var assignment = peek(assignmentStack);
        assignment.add(ref);
      } else {
        peek(codePathStack).codePath.currentSegments.forEach(function (segment) {
          lvaForSegment(segment).add(ref);
        });
      }
    }
    function lvaForSegment(segment) {
      var lva;
      if (liveVariablesMap.has(segment.id)) {
        lva = liveVariablesMap.get(segment.id);
      } else {
        lva = new helpers_1.LiveVariables(segment);
        liveVariablesMap.set(segment.id, lva);
      }
      return lva;
    }
    function updateReadVariables(reference) {
      var variable = reference.resolved;
      if (reference.isRead()) {
        readVariables.add(variable);
      }
    }
    function updateVariableUsages(variable) {
      var codePathId = peek(codePathStack).codePath.id;
      if (variableUsages.has(variable)) {
        variableUsages.get(variable).add(codePathId);
      } else {
        variableUsages.set(variable, new Set([codePathId]));
      }
    }
    function popContext() {
      codePathStack.pop();
    }
    function pushContext(codePathContext) {
      codePathStack.push(codePathContext);
    }
    function resolveReference(node) {
      return resolveReferenceRecursively(node, context.getScope());
    }
    function resolveReferenceRecursively(node, scope, depth) {
      if (depth === void 0) {
        depth = 0;
      }
      if (scope === null || depth > 2) {
        return { ref: null, variable: null };
      }
      var ref = scope.references.find(function (r) {
        return r.identifier === node;
      });
      if (ref) {
        return { ref: ref, variable: ref.resolved };
      } else {
        // if it's not a reference, it can be just declaration without initializer
        var variable = scope.variables.find(function (v) {
          return v.defs.find(function (def) {
            return def.name === node;
          });
        });
        if (variable) {
          return { ref: null, variable: variable };
        }
        // we only need 1-level recursion, only for switch expression, which is likely a bug in eslint
        return resolveReferenceRecursively(node, scope.upper, depth + 1);
      }
    }
  },
};
var CodePathContext = /** @class */ (function () {
  function CodePathContext(codePath) {
    this.segments = new Map();
    this.assignmentStack = [];
    this.codePath = codePath;
  }
  return CodePathContext;
})();
var DestructuringContext = /** @class */ (function () {
  function DestructuringContext() {
    this.hasRest = false;
    this.references = [];
  }
  return DestructuringContext;
})();
var AssignmentContext = /** @class */ (function () {
  function AssignmentContext(node) {
    this.lhs = new Set();
    this.rhs = new Set();
    this.node = node;
  }
  AssignmentContext.prototype.isRhs = function (node) {
    return this.node.type === 'AssignmentExpression'
      ? this.node.right === node
      : this.node.init === node;
  };
  AssignmentContext.prototype.isLhs = function (node) {
    return this.node.type === 'AssignmentExpression'
      ? this.node.left === node
      : this.node.id === node;
  };
  AssignmentContext.prototype.add = function (ref) {
    var parent = ref.identifier;
    while (parent) {
      if (this.isLhs(parent)) {
        this.lhs.add(ref);
        break;
      }
      if (this.isRhs(parent)) {
        this.rhs.add(ref);
        break;
      }
      parent = parent.parent;
    }
    if (parent === null) {
      throw new Error('failed to find assignment lhs/rhs');
    }
  };
  return AssignmentContext;
})();
var JSXReference = /** @class */ (function () {
  function JSXReference(node, scope) {
    this.init = false;
    this.writeExpr = null;
    this.from = scope;
    this.identifier = node;
    this.resolved = findJSXVariableInScope(node, scope);
  }
  JSXReference.prototype.isRead = function () {
    return true;
  };
  JSXReference.prototype.isReadOnly = function () {
    return true;
  };
  JSXReference.prototype.isReadWrite = function () {
    return false;
  };
  JSXReference.prototype.isWrite = function () {
    return false;
  };
  JSXReference.prototype.isWriteOnly = function () {
    return false;
  };
  return JSXReference;
})();
function findJSXVariableInScope(node, scope) {
  return (
    scope &&
    (scope.variables.find(function (v) {
      return v.name === node.name;
    }) ||
      findJSXVariableInScope(node, scope.upper))
  );
}
function peek(arr) {
  return arr[arr.length - 1];
}
