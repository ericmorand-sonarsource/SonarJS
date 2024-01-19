'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.isAnyLiteral = exports.getSensitiveEffect = exports.AwsIamPolicyTemplate = void 0;
var cdk_1 = require('./cdk');
var parameters_1 = require('../../../linter/parameters');
var result_1 = require('../result');
var ast_1 = require('../ast');
var module_1 = require('../module');
var PROPERTIES_POSITION = 0;
var POLICY_DOCUMENT_STATEMENT_PROPERTY = 'Statement';
var ARN_PRINCIPAL = 'aws_cdk_lib.aws_iam.ArnPrincipal';
var STAR_PRINCIPAL = 'aws_cdk_lib.aws_iam.StarPrincipal';
var ANY_PRINCIPAL = 'aws_cdk_lib.aws_iam.AnyPrincipal';
var ANY_LITERAL = '*';
var PROPERTIES_OPTIONS = {
  effect: {
    property: 'effect',
    type: 'FullyQualifiedName',
    allowValue: 'aws_cdk_lib.aws_iam.Effect.ALLOW',
  },
  actions: {
    property: 'actions',
  },
  resources: {
    property: 'resources',
  },
  conditions: {
    property: 'conditions',
  },
  principals: {
    property: 'principals',
    type: 'FullyQualifiedName',
    anyValues: [STAR_PRINCIPAL, ANY_PRINCIPAL, ARN_PRINCIPAL],
  },
};
var JSON_OPTIONS = {
  effect: {
    property: 'Effect',
    type: 'string',
    allowValue: 'Allow',
  },
  actions: {
    property: 'Action',
  },
  resources: {
    property: 'Resource',
  },
  conditions: {
    property: 'Condition',
  },
  principals: {
    property: 'Principal',
    type: 'json',
  },
};
function AwsIamPolicyTemplate(statementChecker) {
  return (0, cdk_1.AwsCdkTemplate)(
    {
      'aws-cdk-lib.aws-iam.PolicyStatement': {
        newExpression: policyStatementChecker(statementChecker, PROPERTIES_OPTIONS),
        functionName: 'fromJson',
        callExpression: policyStatementChecker(statementChecker, JSON_OPTIONS),
      },
      'aws-cdk-lib.aws-iam.PolicyDocument': {
        functionName: 'fromJson',
        callExpression: policyDocumentChecker(statementChecker, JSON_OPTIONS),
      },
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
}
exports.AwsIamPolicyTemplate = AwsIamPolicyTemplate;
function getSensitiveEffect(properties, ctx, options) {
  var effect = properties.getProperty(options.effect.property);
  return effect.filter(function (node) {
    if (options.effect.type === 'FullyQualifiedName') {
      var fullyQualifiedName = (0, cdk_1.normalizeFQN)(
        (0, module_1.getFullyQualifiedName)(ctx, node),
      );
      return fullyQualifiedName === options.effect.allowValue;
    } else {
      return (0, ast_1.isStringLiteral)(node) && node.value === options.effect.allowValue;
    }
  });
}
exports.getSensitiveEffect = getSensitiveEffect;
function isAnyLiteral(literal) {
  return literal.value === ANY_LITERAL;
}
exports.isAnyLiteral = isAnyLiteral;
function policyDocumentChecker(statementChecker, options) {
  return function (expr, ctx) {
    var call = (0, result_1.getResultOfExpression)(ctx, expr);
    var properties = call.getArgument(PROPERTIES_POSITION);
    var statements = properties.getProperty(POLICY_DOCUMENT_STATEMENT_PROPERTY);
    if (statements.isFound) {
      for (var _i = 0, _a = (0, ast_1.flattenArgs)(ctx, [statements.node]); _i < _a.length; _i++) {
        var node = _a[_i];
        statementChecker(node, ctx, options);
      }
    }
  };
}
function policyStatementChecker(statementChecker, options) {
  return function (expr, ctx) {
    var call = (0, result_1.getResultOfExpression)(ctx, expr);
    var properties = call.getArgument(PROPERTIES_POSITION);
    if (properties.isFound) {
      statementChecker(properties.node, ctx, options);
    }
  };
}
