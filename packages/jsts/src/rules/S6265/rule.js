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
// https://sonarsource.github.io/rspec/#/rspec/S6265/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var parameters_1 = require('../../linter/parameters');
var helpers_1 = require('../helpers');
var cdk_1 = require('../helpers/aws/cdk');
var s3_1 = require('../helpers/aws/s3');
var messages = {
  accessLevel: function (param) {
    return 'Make sure granting '.concat(param, ' access is safe here.');
  },
  unrestricted: 'Make sure allowing unrestricted access to objects from this bucket is safe here.',
};
var ACCESS_CONTROL_KEY = 'accessControl';
var INVALID_ACCESS_CONTROL_VALUES = ['PUBLIC_READ', 'PUBLIC_READ_WRITE', 'AUTHENTICATED_READ'];
var PUBLIC_READ_ACCESS_KEY = 'publicReadAccess';
var INVALID_PUBLIC_READ_ACCESS_VALUE = true;
exports.rule = {
  create: function (context) {
    return (0, helpers_1.mergeRules)(
      s3BucketConstructorRule.create(context),
      s3BucketDeploymentConstructorRule.create(context),
      handleGrantPublicAccess.create(context),
    );
  },
  meta: {
    schema: [
      {
        // internal parameter for rules having secondary locations
        enum: [parameters_1.SONAR_RUNTIME],
      },
    ],
  },
};
var s3BucketConstructorRule = (0, s3_1.S3BucketTemplate)(function (bucketConstructor, context) {
  for (
    var _i = 0, INVALID_ACCESS_CONTROL_VALUES_1 = INVALID_ACCESS_CONTROL_VALUES;
    _i < INVALID_ACCESS_CONTROL_VALUES_1.length;
    _i++
  ) {
    var value = INVALID_ACCESS_CONTROL_VALUES_1[_i];
    checkConstantParam(context, bucketConstructor, ACCESS_CONTROL_KEY, [
      'BucketAccessControl',
      value,
    ]);
  }
  checkBooleanParam(
    context,
    bucketConstructor,
    PUBLIC_READ_ACCESS_KEY,
    INVALID_PUBLIC_READ_ACCESS_VALUE,
  );
});
var s3BucketDeploymentConstructorRule = {
  create: function (context) {
    return {
      NewExpression: function (node) {
        if ((0, s3_1.isS3BucketDeploymentConstructor)(context, node)) {
          for (
            var _i = 0, INVALID_ACCESS_CONTROL_VALUES_2 = INVALID_ACCESS_CONTROL_VALUES;
            _i < INVALID_ACCESS_CONTROL_VALUES_2.length;
            _i++
          ) {
            var value = INVALID_ACCESS_CONTROL_VALUES_2[_i];
            checkConstantParam(context, node, ACCESS_CONTROL_KEY, ['BucketAccessControl', value]);
          }
        }
      },
    };
  },
};
function checkBooleanParam(context, bucketConstructor, propName, propValue) {
  var property = (0, s3_1.getProperty)(context, bucketConstructor, propName);
  if (property == null) {
    return;
  }
  var propertyLiteralValue = (0, helpers_1.getValueOfExpression)(
    context,
    property.value,
    'Literal',
  );
  if (
    (propertyLiteralValue === null || propertyLiteralValue === void 0
      ? void 0
      : propertyLiteralValue.value) === propValue
  ) {
    var secondary = (0, s3_1.findPropagatedSetting)(property, propertyLiteralValue);
    context.report({
      message: (0, helpers_1.toEncodedMessage)(
        messages.unrestricted,
        secondary.locations,
        secondary.messages,
      ),
      node: property,
    });
  }
}
function checkConstantParam(context, bucketConstructor, propName, paramQualifiers) {
  var property = (0, s3_1.getProperty)(context, bucketConstructor, propName);
  if (property == null) {
    return;
  }
  var propertyLiteralValue = (0, helpers_1.getValueOfExpression)(
    context,
    property.value,
    'MemberExpression',
  );
  if (
    propertyLiteralValue !== undefined &&
    (0, cdk_1.normalizeFQN)((0, helpers_1.getFullyQualifiedName)(context, propertyLiteralValue)) ===
      'aws_cdk_lib.aws_s3.'.concat(paramQualifiers.join('.'))
  ) {
    var secondary = (0, s3_1.findPropagatedSetting)(property, propertyLiteralValue);
    context.report({
      message: (0, helpers_1.toEncodedMessage)(
        messages.accessLevel(paramQualifiers[paramQualifiers.length - 1]),
        secondary.locations,
        secondary.messages,
      ),
      node: property,
    });
  }
}
var handleGrantPublicAccess = {
  create: function (context) {
    return {
      CallExpression: function (node) {
        if (!(0, helpers_1.isMethodCall)(node)) {
          return;
        }
        var _a = node.callee,
          object = _a.object,
          property = _a.property;
        var isGrantPublicAccessMethodCall = (0, helpers_1.isIdentifier)(
          property,
          'grantPublicAccess',
        );
        if (!isGrantPublicAccessMethodCall) {
          return;
        }
        var variableAssignment = (0, helpers_1.getUniqueWriteUsageOrNode)(context, object);
        var isS3bucketInstance =
          variableAssignment.type === 'NewExpression' &&
          (0, s3_1.isS3BucketConstructor)(context, variableAssignment);
        if (!isS3bucketInstance) {
          return;
        }
        context.report({
          message: (0, helpers_1.toEncodedMessage)(messages.unrestricted),
          node: property,
        });
      },
    };
  },
};
