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
// https://sonarsource.github.io/rspec/#/rspec/S6252/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var parameters_1 = require('../../linter/parameters');
var helpers_1 = require('../helpers');
var s3_1 = require('../helpers/aws/s3');
var VERSIONED_KEY = 'versioned';
var messages = {
  unversioned: 'Make sure using unversioned S3 bucket is safe here.',
  omitted:
    'Omitting the "versioned" argument disables S3 bucket versioning. Make sure it is safe here.',
  secondary: 'Propagated setting',
};
exports.rule = (0, s3_1.S3BucketTemplate)(
  function (bucketConstructor, context) {
    var versionedProperty = (0, s3_1.getProperty)(context, bucketConstructor, VERSIONED_KEY);
    if (versionedProperty == null) {
      context.report({
        message: (0, helpers_1.toEncodedMessage)(messages.omitted),
        node: bucketConstructor.callee,
      });
      return;
    }
    var propertyLiteralValue = (0, helpers_1.getValueOfExpression)(
      context,
      versionedProperty.value,
      'Literal',
    );
    if (
      (propertyLiteralValue === null || propertyLiteralValue === void 0
        ? void 0
        : propertyLiteralValue.value) === false
    ) {
      var secondary = { locations: [], messages: [] };
      var isPropagatedProperty = versionedProperty.value !== propertyLiteralValue;
      if (isPropagatedProperty) {
        secondary.locations = [(0, helpers_1.getNodeParent)(propertyLiteralValue)];
        secondary.messages = [messages.secondary];
      }
      context.report({
        message: (0, helpers_1.toEncodedMessage)(
          messages.unversioned,
          secondary.locations,
          secondary.messages,
        ),
        node: versionedProperty,
      });
    }
  },
  {
    meta: {
      schema: [
        {
          // internal parameter for rules having secondary locations
          enum: [parameters_1.SONAR_RUNTIME],
        },
      ],
    },
  },
);
