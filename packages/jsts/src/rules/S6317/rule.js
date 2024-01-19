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
// https://sonarsource.github.io/rspec/#/rspec/S6317/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
var result_1 = require('../helpers/result');
var iam_1 = require('../helpers/aws/iam');
var SENSITIVE_RESOURCE = /^(\*|arn:[^:]*:[^:]*:[^:]*:[^:]*:(role|user|group)\/\*)$/;
var SENSITIVE_ACTIONS = [
  'cloudformation:CreateStack',
  'datapipeline:CreatePipeline',
  'datapipeline:PutPipelineDefinition',
  'ec2:RunInstances',
  'glue:CreateDevEndpoint',
  'glue:UpdateDevEndpoint',
  'iam:AddUserToGroup',
  'iam:AttachGroupPolicy',
  'iam:AttachRolePolicy',
  'iam:AttachUserPolicy',
  'iam:CreateAccessKey',
  'iam:CreateLoginProfile',
  'iam:CreatePolicyVersion',
  'iam:PassRole',
  'iam:PutGroupPolicy',
  'iam:PutRolePolicy',
  'iam:PutUserPolicy',
  'iam:SetDefaultPolicyVersion',
  'iam:UpdateAssumeRolePolicy',
  'iam:UpdateLoginProfile',
  'lambda:AddPermission',
  'lambda:CreateEventSourceMapping',
  'lambda:CreateFunction',
  'lambda:InvokeFunction',
  'lambda:UpdateFunctionCode',
  'sts:AssumeRole',
];
var MESSAGES = {
  message: function (attackVectorName) {
    return (
      'This policy is vulnerable to the "'.concat(
        attackVectorName,
        '" privilege escalation vector. ',
      ) + 'Remove permissions or restrict the set of resources they apply to.'
    );
  },
  secondary: 'Permissions are granted on all resources.',
};
exports.rule = (0, iam_1.AwsIamPolicyTemplate)(privilegeEscalationStatementChecker);
function privilegeEscalationStatementChecker(expr, ctx, options) {
  var properties = (0, result_1.getResultOfExpression)(ctx, expr);
  var effect = (0, iam_1.getSensitiveEffect)(properties, ctx, options);
  var resource = getSensitiveResource(properties, options);
  var action = getSensitiveAction(properties, options);
  if (
    !hasExceptionProperties(properties, options) &&
    (effect.isFound || effect.isMissing) &&
    resource &&
    action
  ) {
    ctx.report({
      message: (0, helpers_1.toEncodedMessage)(
        MESSAGES.message(action.value),
        [action],
        [MESSAGES.secondary],
      ),
      node: resource,
    });
  }
}
function getSensitiveAction(properties, options) {
  var actions = properties.getProperty(options.actions.property);
  return actions.asStringLiterals().find(isSensitiveAction);
}
function getSensitiveResource(properties, options) {
  var resources = properties.getProperty(options.resources.property);
  return resources.asStringLiterals().find(isSensitiveResource);
}
function isSensitiveAction(action) {
  return SENSITIVE_ACTIONS.includes(action.value);
}
function isSensitiveResource(resource) {
  return SENSITIVE_RESOURCE.test(resource.value);
}
function hasExceptionProperties(properties, options) {
  var exceptionProperties = [options.principals.property, options.conditions.property];
  return exceptionProperties.some(function (prop) {
    return !properties.getProperty(prop).isMissing;
  });
}
