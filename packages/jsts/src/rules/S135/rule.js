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
// https://sonarsource.github.io/rspec/#/rspec/S135/javascript
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
    var jumpTargets = [];
    function enterScope() {
      jumpTargets.push(new JumpTarget());
    }
    function leaveScope() {
      jumpTargets.pop();
    }
    function increateNumberOfJumpsInScopes(jump, label) {
      for (var _i = 0, _a = __spreadArray([], jumpTargets, true).reverse(); _i < _a.length; _i++) {
        var jumpTarget = _a[_i];
        jumpTarget.jumps.push(jump);
        if (label === jumpTarget.label) {
          break;
        }
      }
    }
    function leaveScopeAndCheckNumberOfJumps(node) {
      var _a;
      var jumps = (_a = jumpTargets.pop()) === null || _a === void 0 ? void 0 : _a.jumps;
      if (jumps && jumps.length > 1) {
        var sourceCode = context.sourceCode;
        var firstToken = sourceCode.getFirstToken(node);
        context.report({
          loc: firstToken.loc,
          message: (0, helpers_1.toEncodedMessage)(
            'Reduce the total number of "break" and "continue" statements in this loop to use one at most.',
            jumps,
            jumps.map(function (jmp) {
              return jmp.type === 'BreakStatement' ? '"break" statement.' : '"continue" statement.';
            }),
          ),
        });
      }
    }
    return {
      Program: function () {
        jumpTargets = [];
      },
      BreakStatement: function (node) {
        var _a;
        var breakStatement = node;
        increateNumberOfJumpsInScopes(
          breakStatement,
          (_a = breakStatement.label) === null || _a === void 0 ? void 0 : _a.name,
        );
      },
      ContinueStatement: function (node) {
        var _a;
        var continueStatement = node;
        increateNumberOfJumpsInScopes(
          continueStatement,
          (_a = continueStatement.label) === null || _a === void 0 ? void 0 : _a.name,
        );
      },
      SwitchStatement: enterScope,
      'SwitchStatement:exit': leaveScope,
      ForStatement: enterScope,
      'ForStatement:exit': leaveScopeAndCheckNumberOfJumps,
      ForInStatement: enterScope,
      'ForInStatement:exit': leaveScopeAndCheckNumberOfJumps,
      ForOfStatement: enterScope,
      'ForOfStatement:exit': leaveScopeAndCheckNumberOfJumps,
      WhileStatement: enterScope,
      'WhileStatement:exit': leaveScopeAndCheckNumberOfJumps,
      DoWhileStatement: enterScope,
      'DoWhileStatement:exit': leaveScopeAndCheckNumberOfJumps,
      LabeledStatement: function (node) {
        var labeledStatement = node;
        jumpTargets.push(new JumpTarget(labeledStatement.label.name));
      },
      'LabeledStatement:exit': leaveScope,
    };
  },
};
var JumpTarget = /** @class */ (function () {
  function JumpTarget(label) {
    this.jumps = [];
    this.label = label;
  }
  return JumpTarget;
})();
