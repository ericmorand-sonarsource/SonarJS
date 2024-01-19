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
// https://sonarsource.github.io/rspec/#/rspec/S6351/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
var regex_1 = require('../helpers/regex');
var parameters_1 = require('../../linter/parameters');
exports.rule = {
  meta: {
    schema: [
      {
        // internal parameter for rules having secondary locations
        enum: [parameters_1.SONAR_RUNTIME],
      },
    ],
  },
  create: function (context) {
    var invocations = new Map();
    var regexes = [];
    var resets = new Set();
    return {
      'Literal:exit': function (node) {
        extractRegex(node, regexes);
      },
      'CallExpression:exit': function (node) {
        var callExpr = node;
        extractRegex(node, regexes);
        extractRegexInvocation(callExpr, regexes, invocations, context);
        checkWhileConditionRegex(callExpr, context);
      },
      'MemberExpression:exit': function (node) {
        extractResetRegex(node, regexes, resets, context);
      },
      'NewExpression:exit': function (node) {
        extractRegex(node, regexes);
      },
      'Program:exit': function () {
        regexes.forEach(function (regex) {
          return checkGlobalStickyRegex(regex, context);
        });
        invocations.forEach(function (usages, regex) {
          return checkMultipleInputsRegex(regex, usages, resets, context);
        });
      },
    };
  },
};
function extractRegex(node, acc) {
  var _a;
  if ((0, helpers_1.isRegexLiteral)(node)) {
    var flags = node.regex.flags;
    acc.push({ node: node, flags: flags });
  } else if ((0, regex_1.isRegExpConstructor)(node)) {
    var flags = (_a = (0, regex_1.getFlags)(node)) !== null && _a !== void 0 ? _a : '';
    acc.push({ node: node, flags: flags });
  }
}
function extractRegexInvocation(callExpr, regexes, invocations, context) {
  if (
    (0, helpers_1.isCallingMethod)(callExpr, 1, 'exec', 'test') &&
    callExpr.callee.object.type === 'Identifier'
  ) {
    var object = callExpr.callee.object;
    var variable = (0, helpers_1.getVariableFromName)(context, object.name);
    if (variable) {
      var value_1 = (0, helpers_1.getUniqueWriteUsage)(context, variable.name);
      var regex = regexes.find(function (r) {
        return r.node === value_1;
      });
      if (regex === null || regex === void 0 ? void 0 : regex.flags.includes('g')) {
        var usages = invocations.get(variable);
        if (usages) {
          usages.push(callExpr);
        } else {
          invocations.set(variable, [callExpr]);
        }
      }
    }
  }
}
function extractResetRegex(node, regexes, resets, context) {
  /* RegExp.prototype.lastIndex = ... */
  if (
    (0, helpers_1.isDotNotation)(node) &&
    node.object.type === 'Identifier' &&
    node.property.name === 'lastIndex'
  ) {
    var parent_1 = (0, helpers_1.getParent)(context);
    if (
      (parent_1 === null || parent_1 === void 0 ? void 0 : parent_1.type) ===
        'AssignmentExpression' &&
      parent_1.left === node
    ) {
      var variable = (0, helpers_1.getVariableFromName)(context, node.object.name);
      if (variable) {
        var value_2 = (0, helpers_1.getUniqueWriteUsage)(context, variable.name);
        var regex = regexes.find(function (r) {
          return r.node === value_2;
        });
        if (regex) {
          resets.add(variable);
        }
      }
    }
  }
}
function checkWhileConditionRegex(callExpr, context) {
  /* RegExp.prototype.exec() within while conditions */
  if ((0, helpers_1.isMethodCall)(callExpr)) {
    var _a = callExpr.callee,
      object = _a.object,
      property = _a.property;
    if (
      ((0, helpers_1.isRegexLiteral)(object) || (0, regex_1.isRegExpConstructor)(object)) &&
      property.name === 'exec'
    ) {
      var flags = object.type === 'Literal' ? object.regex.flags : (0, regex_1.getFlags)(object);
      if (
        (flags === null || flags === void 0 ? void 0 : flags.includes('g')) &&
        isWithinWhileCondition(callExpr, context)
      ) {
        context.report({
          message: (0, helpers_1.toEncodedMessage)(
            'Extract this regular expression to avoid infinite loop.',
            [],
          ),
          node: object,
        });
      }
    }
  }
}
function checkGlobalStickyRegex(regex, context) {
  /* RegExp with `g` and `y` flags */
  if (regex.flags.includes('g') && regex.flags.includes('y')) {
    context.report({
      message: (0, helpers_1.toEncodedMessage)(
        "Remove the 'g' flag from this regex as it is shadowed by the 'y' flag.",
        [],
      ),
      node: regex.node,
    });
  }
}
function checkMultipleInputsRegex(regex, usages, resets, context) {
  /* RegExp.prototype.exec(input) / RegExp.prototype.test(input) */
  if (!resets.has(regex)) {
    var definition = regex.defs.find(function (def) {
      return def.type === 'Variable' && def.node.init;
    });
    var uniqueInputs = new Set(
      usages.map(function (callExpr) {
        return context.sourceCode.getText(callExpr.arguments[0]);
      }),
    );
    var regexReset = uniqueInputs.has("''") || uniqueInputs.has('""');
    if (definition && uniqueInputs.size > 1 && !regexReset) {
      var pattern = definition.node.init;
      context.report({
        message: (0, helpers_1.toEncodedMessage)(
          "Remove the 'g' flag from this regex as it is used on different inputs.",
          usages,
          usages.map(function (_, idx) {
            return 'Usage '.concat(idx + 1);
          }),
        ),
        node: pattern,
      });
    }
  }
}
function isWithinWhileCondition(node, context) {
  var ancestors = context.getAncestors();
  var parent;
  var child = node;
  while ((parent = ancestors.pop()) !== undefined) {
    if (helpers_1.functionLike.has(parent.type)) {
      break;
    }
    if (parent.type === 'WhileStatement' || parent.type === 'DoWhileStatement') {
      return parent.test === child;
    }
    child = parent;
  }
  return false;
}
