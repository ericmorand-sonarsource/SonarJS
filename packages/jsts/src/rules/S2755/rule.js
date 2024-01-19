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
// https://sonarsource.github.io/rspec/#/rspec/S2755/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
var parameters_1 = require('../../linter/parameters');
var XML_LIBRARY = 'libxmljs';
var XML_PARSERS = ['parseXml', 'parseXmlString'];
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
    function isXmlParserCall(call) {
      var fqn = (0, helpers_1.getFullyQualifiedName)(context, call);
      return XML_PARSERS.some(function (parser) {
        return fqn === ''.concat(XML_LIBRARY, '.').concat(parser);
      });
    }
    function isNoEntSet(property) {
      return property.value.type === 'Literal' && property.value.raw === 'true';
    }
    return {
      CallExpression: function (node) {
        var call = node;
        if (isXmlParserCall(call)) {
          var noent = (0, helpers_1.getObjectExpressionProperty)(call.arguments[1], 'noent');
          if (noent && isNoEntSet(noent)) {
            context.report({
              message: (0, helpers_1.toEncodedMessage)(
                'Disable access to external entities in XML parsing.',
                [call.callee],
              ),
              node: noent,
            });
          }
        }
      },
    };
  },
};
