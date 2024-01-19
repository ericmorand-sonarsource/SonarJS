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
// https://sonarsource.github.io/rspec/#/rspec/S4830/javascript
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
    var MESSAGE = 'Enable server certificate validation on this SSL/TLS connection.';
    var SECONDARY_MESSAGE = 'Set "rejectUnauthorized" to "true".';
    function checkSensitiveArgument(callExpression, sensitiveArgumentIndex) {
      if (callExpression.arguments.length < sensitiveArgumentIndex + 1) {
        return;
      }
      var sensitiveArgument = callExpression.arguments[sensitiveArgumentIndex];
      var secondaryLocations = [];
      var secondaryMessages = [];
      var argumentValue = (0, helpers_1.getValueOfExpression)(
        context,
        sensitiveArgument,
        'ObjectExpression',
      );
      if (!argumentValue) {
        return;
      }
      if (sensitiveArgument !== argumentValue) {
        secondaryLocations.push(argumentValue);
        secondaryMessages.push(undefined);
      }
      var unsafeRejectUnauthorizedConfiguration = (0, helpers_1.getPropertyWithValue)(
        context,
        argumentValue,
        'rejectUnauthorized',
        false,
      );
      if (unsafeRejectUnauthorizedConfiguration) {
        secondaryLocations.push(unsafeRejectUnauthorizedConfiguration);
        secondaryMessages.push(SECONDARY_MESSAGE);
        context.report({
          node: callExpression.callee,
          message: (0, helpers_1.toEncodedMessage)(MESSAGE, secondaryLocations, secondaryMessages),
        });
      }
    }
    return {
      CallExpression: function (node) {
        var callExpression = node;
        var fqn = (0, helpers_1.getFullyQualifiedName)(context, callExpression);
        if (fqn === 'https.request') {
          checkSensitiveArgument(callExpression, 0);
        }
        if (fqn === 'request.get') {
          checkSensitiveArgument(callExpression, 0);
        }
        if (fqn === 'tls.connect') {
          checkSensitiveArgument(callExpression, 2);
        }
      },
    };
  },
};
