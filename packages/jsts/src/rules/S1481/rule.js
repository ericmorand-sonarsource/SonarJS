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
// https://sonarsource.github.io/rspec/#/rspec/S1481/javascript
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
exports.rule = {
  meta: {
    messages: {
      unusedFunction: "Remove unused function '{{symbol}}'.",
      unusedVariable: "Remove the declaration of the unused '{{symbol}}' variable.",
    },
  },
  create: function (context) {
    var toIgnore = [];
    var jsxComponentsToIgnore = [];
    function checkVariable(v, toCheck) {
      if (v.defs.length === 0) {
        return;
      }
      var type = v.defs[0].type;
      if (type !== 'Variable' && type !== 'FunctionName') {
        return;
      }
      if (toCheck === 'let-const-function') {
        var def = v.defs[0];
        if (def.parent && def.parent.type === 'VariableDeclaration' && def.parent.kind === 'var') {
          return;
        }
      }
      var defs = v.defs.map(function (def) {
        return def.name;
      });
      var unused = v.references.every(function (ref) {
        return defs.includes(ref.identifier);
      });
      if (unused && !toIgnore.includes(defs[0]) && !jsxComponentsToIgnore.includes(v.name)) {
        var messageAndData_1 = getMessageAndData(v.name, type === 'FunctionName');
        defs.forEach(function (def) {
          return context.report(__assign({ node: def }, messageAndData_1));
        });
      }
    }
    function isParentOfModuleScope(scope) {
      return scope.childScopes.some(function (s) {
        return s.type === 'module';
      });
    }
    function checkScope(scope, checkedInParent) {
      var toCheck = checkedInParent;
      if (scope.type === 'function' && !isParentOfModuleScope(scope)) {
        toCheck = 'all';
      } else if (checkedInParent === 'nothing' && scope.type === 'block') {
        toCheck = 'let-const-function';
      }
      if (toCheck !== 'nothing' && scope.type !== 'function-expression-name') {
        scope.variables.forEach(function (v) {
          return checkVariable(v, toCheck);
        });
      }
      scope.childScopes.forEach(function (childScope) {
        return checkScope(childScope, toCheck);
      });
    }
    return {
      ObjectPattern: function (node) {
        var elements = node.properties;
        var hasRest = elements.some(function (element) {
          return element.type === 'RestElement';
        });
        if (!hasRest) {
          return;
        }
        elements.forEach(function (element) {
          if (
            element.type === 'Property' &&
            element.shorthand &&
            element.value.type === 'Identifier'
          ) {
            toIgnore.push(element.value);
          }
        });
      },
      JSXIdentifier: function (node) {
        // using 'any' as standard typings for AST don't provide types for JSX
        jsxComponentsToIgnore.push(node.name);
      },
      'Program:exit': function () {
        checkScope(context.getScope(), 'nothing');
        toIgnore = [];
        jsxComponentsToIgnore = [];
      },
    };
  },
};
function getMessageAndData(name, isFunction) {
  if (isFunction) {
    return { messageId: 'unusedFunction', data: { symbol: name } };
  } else {
    return { messageId: 'unusedVariable', data: { symbol: name } };
  }
}
