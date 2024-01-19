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
// https://sonarsource.github.io/rspec/#/rspec/S4165/javascript
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
      reviewAssignment:
        'Review this redundant assignment: "{{symbol}}" already holds the assigned value along all execution paths.',
    },
  },
  create: function (context) {
    var codePathStack = [];
    var reachingDefsMap = new Map();
    // map from Variable to CodePath ids where variable is used
    var variableUsages = new Map();
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
      'Program:exit': function () {
        (0, helpers_1.reachingDefinitions)(reachingDefsMap);
        reachingDefsMap.forEach(function (defs) {
          checkSegment(defs);
        });
        reachingDefsMap.clear();
        variableUsages.clear();
        while (codePathStack.length > 0) {
          codePathStack.pop();
        }
      },
      // CodePath events
      onCodePathSegmentStart: function (segment) {
        reachingDefsMap.set(segment.id, new helpers_1.ReachingDefinitions(segment));
      },
      onCodePathStart: function (codePath) {
        pushContext(new CodePathContext(codePath));
      },
      onCodePathEnd: function () {
        popContext();
      },
    };
    function popAssignmentContext() {
      var assignment = peek(codePathStack).assignmentStack.pop();
      assignment.rhs.forEach(function (r) {
        return processReference(r);
      });
      assignment.lhs.forEach(function (r) {
        return processReference(r);
      });
    }
    function pushAssignmentContext(node) {
      peek(codePathStack).assignmentStack.push(new AssignmentContext(node));
    }
    function checkSegment(reachingDefs) {
      var assignedValuesMap = new Map(reachingDefs.in);
      reachingDefs.references.forEach(function (ref) {
        var variable = ref.resolved;
        if (!variable || !ref.isWrite() || !shouldReport(ref)) {
          return;
        }
        var lhsValues = assignedValuesMap.get(variable);
        var rhsValues = (0, helpers_1.resolveAssignedValues)(
          variable,
          ref.writeExpr,
          assignedValuesMap,
          ref.from,
        );
        if (
          (lhsValues === null || lhsValues === void 0 ? void 0 : lhsValues.type) ===
            'AssignedValues' &&
          (lhsValues === null || lhsValues === void 0 ? void 0 : lhsValues.size) === 1
        ) {
          var lhsVal = __spreadArray([], lhsValues, true)[0];
          checkRedundantAssignement(ref, ref.writeExpr, lhsVal, rhsValues, variable.name);
        }
        assignedValuesMap.set(variable, rhsValues);
      });
    }
    function checkRedundantAssignement(_a, node, lhsVal, rhsValues, name) {
      var variable = _a.resolved;
      if (rhsValues.type === 'UnknownValue' || rhsValues.size !== 1) {
        return;
      }
      var rhsVal = __spreadArray([], rhsValues, true)[0];
      if (!isWrittenOnlyOnce(variable) && lhsVal === rhsVal) {
        context.report({
          node: node,
          messageId: 'reviewAssignment',
          data: {
            symbol: name,
          },
        });
      }
    }
    // to avoid raising on code like:
    // while (cond) {  let x = 42; }
    function isWrittenOnlyOnce(variable) {
      return (
        variable.references.filter(function (ref) {
          return ref.isWrite();
        }).length === 1
      );
    }
    function shouldReport(ref) {
      var variable = ref.resolved;
      return variable && shouldReportReference(ref) && !variableUsedOutsideOfCodePath(variable);
    }
    function shouldReportReference(ref) {
      var variable = ref.resolved;
      return (
        variable &&
        !isDefaultParameter(ref) &&
        !variable.name.startsWith('_') &&
        !isCompoundAssignment(ref.writeExpr) &&
        !isSelfAssignement(ref) &&
        !variable.defs.some(function (def) {
          return def.type === 'Parameter' || (def.type === 'Variable' && !def.node.init);
        })
      );
    }
    function isEnumConstant() {
      return context.getAncestors().some(function (n) {
        return n.type === 'TSEnumDeclaration';
      });
    }
    function variableUsedOutsideOfCodePath(variable) {
      return variableUsages.get(variable).size > 1;
    }
    function checkIdentifierUsage(node) {
      var _a = resolveReference(node),
        ref = _a.ref,
        variable = _a.variable;
      if (ref) {
        processReference(ref);
      }
      if (variable) {
        updateVariableUsages(variable);
      }
    }
    function processReference(ref) {
      var assignmentStack = peek(codePathStack).assignmentStack;
      if (assignmentStack.length > 0) {
        var assignment = peek(assignmentStack);
        assignment.add(ref);
      } else {
        peek(codePathStack).codePath.currentSegments.forEach(function (segment) {
          var reachingDefs = reachingDefsForSegment(segment);
          reachingDefs.add(ref);
        });
      }
    }
    function reachingDefsForSegment(segment) {
      var defs;
      if (reachingDefsMap.has(segment.id)) {
        defs = reachingDefsMap.get(segment.id);
      } else {
        defs = new helpers_1.ReachingDefinitions(segment);
        reachingDefsMap.set(segment.id, defs);
      }
      return defs;
    }
    function updateVariableUsages(variable) {
      var codePathId = peek(codePathStack).codePath.id;
      if (variableUsages.has(variable)) {
        variableUsages.get(variable).add(codePathId);
      } else {
        variableUsages.set(variable, new Set([codePathId]));
      }
    }
    function pushContext(codePathContext) {
      codePathStack.push(codePathContext);
    }
    function popContext() {
      codePathStack.pop();
    }
    function resolveReferenceRecursively(node, scope) {
      if (scope === null) {
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
        // in theory we only need 1-level recursion, only for switch expression, which is likely a bug in eslint
        // generic recursion is used for safety & readability
        return resolveReferenceRecursively(node, scope.upper);
      }
    }
    function resolveReference(node) {
      return resolveReferenceRecursively(node, context.getScope());
    }
  },
};
var CodePathContext = /** @class */ (function () {
  function CodePathContext(codePath) {
    this.reachingDefinitionsMap = new Map();
    this.reachingDefinitionsStack = [];
    this.segments = new Map();
    this.assignmentStack = [];
    this.codePath = codePath;
  }
  return CodePathContext;
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
function peek(arr) {
  return arr[arr.length - 1];
}
function isSelfAssignement(ref) {
  var _a;
  var lhs = ref.resolved;
  if (((_a = ref.writeExpr) === null || _a === void 0 ? void 0 : _a.type) === 'Identifier') {
    var rhs = (0, helpers_1.getVariableFromIdentifier)(ref.writeExpr, ref.from);
    return lhs === rhs;
  }
  return false;
}
function isCompoundAssignment(writeExpr) {
  if (writeExpr === null || writeExpr === void 0 ? void 0 : writeExpr.hasOwnProperty('parent')) {
    var node = writeExpr.parent;
    return node && node.type === 'AssignmentExpression' && node.operator !== '=';
  }
  return false;
}
function isDefaultParameter(ref) {
  if (ref.identifier.type !== 'Identifier') {
    return false;
  }
  var parent = ref.identifier.parent;
  return parent && parent.type === 'AssignmentPattern';
}
