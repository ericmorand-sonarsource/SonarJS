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
// https://sonarsource.github.io/rspec/#/rspec/S6079/javascript
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
    var currentDoneVariable;
    var doneCall;
    var doneSegment;
    var currentSegment;
    var currentCase;
    var segmentFirstStatement = new Map();
    function checkForTestCase(node) {
      var testCase = helpers_1.Mocha.extractTestCase(node);
      if (!testCase) {
        return;
      }
      currentCase = testCase;
      currentDoneVariable = undefined;
      if (testCase.callback.params.length === 0) {
        return;
      }
      var done = testCase.callback.params[0];
      if (done.type !== 'Identifier') {
        return;
      }
      var callbackScope = context.getScope().childScopes.find(function (scope) {
        return scope.block === testCase.callback;
      });
      if (!callbackScope) {
        return;
      }
      currentDoneVariable = (0, helpers_1.getVariableFromIdentifier)(done, callbackScope);
    }
    function checkForDoneCall(node) {
      var callee = node.callee;
      if (
        currentDoneVariable === null || currentDoneVariable === void 0
          ? void 0
          : currentDoneVariable.references.some(function (ref) {
              return ref.identifier === callee;
            })
      ) {
        doneCall = node;
        doneSegment = currentSegment;
      }
    }
    function report(statementAfterDone) {
      context.report({
        node: statementAfterDone,
        message: (0, helpers_1.toEncodedMessage)('Move this code before the call to "done".', [
          doneCall,
        ]),
      });
      doneSegment = undefined;
      doneCall = undefined;
      currentDoneVariable = undefined;
    }
    return {
      CallExpression: function (node) {
        checkForTestCase(node);
        checkForDoneCall(node);
      },
      ExpressionStatement: function (node) {
        if (currentSegment && currentSegment === doneSegment) {
          report(node);
        }
        if (currentSegment && !segmentFirstStatement.has(currentSegment)) {
          segmentFirstStatement.set(currentSegment, node);
        }
      },
      onCodePathSegmentStart: function (segment) {
        currentSegment = segment;
      },
      onCodePathEnd: function (_codePath, node) {
        currentSegment = undefined;
        if (
          (currentCase === null || currentCase === void 0 ? void 0 : currentCase.callback) ===
            node &&
          doneSegment
        ) {
          // we report an issue if one of 'doneSegment.nextSegments' is not empty
          var statementAfterDone = doneSegment.nextSegments
            .map(function (segment) {
              return segmentFirstStatement.get(segment);
            })
            .find(function (stmt) {
              return !!stmt;
            });
          if (statementAfterDone) {
            report(statementAfterDone);
          }
        }
      },
    };
  },
};
