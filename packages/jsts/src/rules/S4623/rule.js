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
// https://sonarsource.github.io/rspec/#/rspec/S4623/javascript
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod)
        if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
var ts = __importStar(require('typescript'));
exports.rule = {
  meta: {
    hasSuggestions: true,
    messages: {
      removeUndefined: 'Remove this redundant "undefined".',
      suggestRemoveUndefined: 'Remove this redundant argument',
    },
  },
  create: function (context) {
    var services = context.sourceCode.parserServices;
    if ((0, helpers_1.isRequiredParserServices)(services)) {
      return {
        CallExpression: function (node) {
          var call = node;
          var args = call.arguments;
          if (args.length === 0) {
            return;
          }
          var lastArgument = args[args.length - 1];
          if (
            (0, helpers_1.isUndefined)(lastArgument) &&
            isOptionalParameter(args.length - 1, call, services)
          ) {
            context.report({
              messageId: 'removeUndefined',
              node: lastArgument,
              suggest: [
                {
                  messageId: 'suggestRemoveUndefined',
                  fix: function (fixer) {
                    if (call.arguments.length === 1) {
                      var openingParen = context.sourceCode.getTokenAfter(call.callee);
                      var closingParen = context.sourceCode.getLastToken(node);
                      var _a = openingParen.range,
                        begin = _a[1];
                      var end = closingParen.range[0];
                      return fixer.removeRange([begin, end]);
                    } else {
                      var _b = args[args.length - 2].range,
                        begin = _b[1];
                      var _c = lastArgument.range,
                        end = _c[1];
                      return fixer.removeRange([begin, end]);
                    }
                  },
                },
              ],
            });
          }
        },
      };
    }
    return {};
  },
};
function isOptionalParameter(paramIndex, node, services) {
  var signature = services.program
    .getTypeChecker()
    .getResolvedSignature(services.esTreeNodeToTSNodeMap.get(node));
  if (signature) {
    var declaration = signature.declaration;
    if (declaration && isFunctionLikeDeclaration(declaration)) {
      var parameters = declaration.parameters;
      var parameter = parameters[paramIndex];
      return parameter && (parameter.initializer || parameter.questionToken);
    }
  }
  return false;
}
function isFunctionLikeDeclaration(declaration) {
  return [
    ts.SyntaxKind.FunctionDeclaration,
    ts.SyntaxKind.FunctionExpression,
    ts.SyntaxKind.ArrowFunction,
    ts.SyntaxKind.MethodDeclaration,
    ts.SyntaxKind.Constructor,
    ts.SyntaxKind.GetAccessor,
    ts.SyntaxKind.SetAccessor,
  ].includes(declaration.kind);
}
