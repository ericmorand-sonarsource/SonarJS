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
// https://sonarsource.github.io/rspec/#/rspec/S4782/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
var parameters_1 = require('../../linter/parameters');
exports.rule = {
  meta: {
    hasSuggestions: true,
    schema: [
      {
        // internal parameter for rules having secondary locations
        enum: [parameters_1.SONAR_RUNTIME],
      },
    ],
  },
  create: function (context) {
    if (!(0, helpers_1.isRequiredParserServices)(context.sourceCode.parserServices)) {
      return {};
    }
    function checkProperty(node) {
      var tsNode = node;
      var optionalToken = context.sourceCode.getFirstToken(node, function (token) {
        return token.value === '?';
      });
      if (!tsNode.optional || !optionalToken) {
        return;
      }
      var typeNode = getUndefinedTypeAnnotation(tsNode.typeAnnotation);
      if (typeNode) {
        var suggest = getQuickFixSuggestions(context, optionalToken, typeNode);
        var secondaryLocations = [typeNode];
        var message = (0, helpers_1.toEncodedMessage)(
          "Consider removing 'undefined' type or '?' specifier, one of them is redundant.",
          secondaryLocations,
        );
        context.report({
          message: message,
          loc: optionalToken.loc,
          suggest: suggest,
        });
      }
    }
    return {
      'PropertyDefinition, TSPropertySignature': function (node) {
        return checkProperty(node);
      },
    };
  },
};
function getUndefinedTypeAnnotation(tsTypeAnnotation) {
  if (tsTypeAnnotation) {
    return getUndefinedTypeNode(tsTypeAnnotation.typeAnnotation);
  }
  return undefined;
}
function getUndefinedTypeNode(typeNode) {
  if (typeNode.type === 'TSUndefinedKeyword') {
    return typeNode;
  } else if (typeNode.type === 'TSUnionType') {
    return typeNode.types.map(getUndefinedTypeNode).find(function (tpe) {
      return tpe !== undefined;
    });
  }
  return undefined;
}
function getQuickFixSuggestions(context, optionalToken, undefinedType) {
  var _a;
  var suggestions = [
    {
      desc: 'Remove "?" operator',
      fix: function (fixer) {
        return fixer.remove(optionalToken);
      },
    },
  ];
  if (
    ((_a = undefinedType.parent) === null || _a === void 0 ? void 0 : _a.type) === 'TSUnionType'
  ) {
    suggestions.push(getUndefinedRemovalSuggestion(context, undefinedType));
  }
  return suggestions;
}
function getUndefinedRemovalSuggestion(context, undefinedType) {
  return {
    desc: 'Remove "undefined" type annotation',
    fix: function (fixer) {
      var fixes = [];
      var unionType = undefinedType.parent;
      if (unionType.types.length === 2) {
        var unionTypeNode = unionType;
        var otherType =
          unionType.types[0] === undefinedType ? unionType.types[1] : unionType.types[0];
        var otherTypeText = context.sourceCode.getText(otherType);
        fixes.push(fixer.replaceText(unionTypeNode, otherTypeText));
        var tokenBefore = context.sourceCode.getTokenBefore(unionTypeNode);
        var tokenAfter = context.sourceCode.getTokenAfter(unionTypeNode);
        if (
          (tokenBefore === null || tokenBefore === void 0 ? void 0 : tokenBefore.value) === '(' &&
          (tokenAfter === null || tokenAfter === void 0 ? void 0 : tokenAfter.value) === ')'
        ) {
          fixes.push(fixer.remove(tokenBefore));
          fixes.push(fixer.remove(tokenAfter));
        }
      } else {
        var index = unionType.types.indexOf(undefinedType);
        if (index === 0) {
          fixes.push(fixer.removeRange([undefinedType.range[0], unionType.types[1].range[0]]));
        } else {
          fixes.push(
            fixer.removeRange([unionType.types[index - 1].range[1], undefinedType.range[1]]),
          );
        }
      }
      return fixes;
    },
  };
}
