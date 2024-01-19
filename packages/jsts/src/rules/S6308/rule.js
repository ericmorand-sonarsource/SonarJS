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
// https://sonarsource.github.io/rspec/#/rspec/S6308/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var cdk_1 = require('../helpers/aws/cdk');
var helpers_1 = require('../helpers');
var result_1 = require('../helpers/result');
var DOMAIN_PROPS_POSITION = 2;
var ENABLED_PROPERTY = 'enabled';
var OPEN_SEARCH = 'OpenSearch';
var ELASTIC_SEARCH = 'Elasticsearch';
exports.rule = (0, cdk_1.AwsCdkTemplate)(
  {
    'aws-cdk-lib.aws-opensearchservice.Domain': domainChecker({
      encryptionProperty: 'encryptionAtRest',
      version: {
        valueType: 'EngineVersion',
        property: 'version',
        defaultValue: OPEN_SEARCH,
      },
    }),
    'aws-cdk-lib.aws-opensearchservice.CfnDomain': domainChecker({
      encryptionProperty: 'encryptionAtRestOptions',
      version: {
        valueType: 'string',
        property: 'engineVersion',
        defaultValue: OPEN_SEARCH,
      },
    }),
    'aws-cdk-lib.aws-elasticsearch.Domain': domainChecker({
      encryptionProperty: 'encryptionAtRest',
      version: {
        valueType: 'ElasticsearchVersion',
        property: 'version',
        defaultValue: ELASTIC_SEARCH,
      },
    }),
    'aws-cdk-lib.aws-elasticsearch.CfnDomain': domainChecker({
      encryptionProperty: 'encryptionAtRestOptions',
      version: {
        valueType: 'string',
        property: 'elasticsearchVersion',
        defaultValue: ELASTIC_SEARCH,
      },
    }),
  },
  {
    meta: {
      messages: {
        encryptionDisabled: 'Make sure that using unencrypted {{search}} domains is safe here.',
        encryptionOmitted:
          'Omitting {{encryptionPropertyName}} causes encryption of data at rest to be ' +
          'disabled for this {{search}} domain. Make sure it is safe here.',
      },
    },
  },
);
function domainChecker(options) {
  return function (expr, ctx) {
    var _a;
    var call = (0, result_1.getResultOfExpression)(ctx, expr);
    var argument = call.getArgument(DOMAIN_PROPS_POSITION);
    var encryption = argument.getProperty(options.encryptionProperty);
    var version = argument.getProperty(options.version.property);
    var isEnabled = encryption.getProperty(ENABLED_PROPERTY);
    var search =
      (_a = version.map(getSearchEngine)) !== null && _a !== void 0
        ? _a
        : options.version.defaultValue;
    if (isEnabled.isMissing) {
      ctx.report({
        messageId: 'encryptionOmitted',
        node: isEnabled.node,
        data: {
          encryptionPropertyName: options.encryptionProperty,
          search: search,
        },
      });
    } else if (isEnabled.isFound && isUnencrypted(isEnabled.node)) {
      ctx.report({
        messageId: 'encryptionDisabled',
        node: isEnabled.node,
        data: {
          search: search,
        },
      });
    }
    function isUnencrypted(node) {
      return (0, helpers_1.isBooleanLiteral)(node) && !node.value;
    }
    function getSearchEngine(node) {
      var _a;
      var version;
      if (options.version.valueType === 'string' && (0, helpers_1.isStringLiteral)(node)) {
        version = ''.concat(options.version.property, '.').concat(node.value);
      } else {
        version = (0, helpers_1.getFullyQualifiedName)(ctx, node);
      }
      for (
        var _i = 0,
          _b =
            (_a =
              version === null || version === void 0
                ? void 0
                : version.toLowerCase().split('.').reverse()) !== null && _a !== void 0
              ? _a
              : [];
        _i < _b.length;
        _i++
      ) {
        var name_1 = _b[_i];
        if (name_1.includes('opensearch')) {
          return OPEN_SEARCH;
        } else if (name_1.includes('elasticsearch')) {
          return ELASTIC_SEARCH;
        }
      }
      return null;
    }
  };
}
