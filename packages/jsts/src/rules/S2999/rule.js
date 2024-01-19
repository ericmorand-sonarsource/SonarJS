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
// https://sonarsource.github.io/rspec/#/rspec/S2999/javascript
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
var ts = __importStar(require('typescript'));
var helpers_1 = require('../helpers');
var parameters_1 = require('../../linter/parameters');
exports.rule = {
  meta: {
    schema: [
      { type: 'object' },
      {
        // internal parameter for rules having secondary locations
        enum: [parameters_1.SONAR_RUNTIME],
      },
    ],
  },
  create: function (context) {
    var considerJSDoc = context.options[0].considerJSDoc;
    var services = context.sourceCode.parserServices;
    if (!(0, helpers_1.isRequiredParserServices)(services)) {
      return {};
    }
    return {
      'NewExpression[callee.type!="ThisExpression"]': function (node) {
        var callee = node.callee;
        var type = (0, helpers_1.getTypeFromTreeNode)(callee, services);
        var signature = (0, helpers_1.getSignatureFromCallee)(node, services);
        if (!isInstantiable(type, signature, considerJSDoc) && !isAny(type)) {
          var functionToken = context.sourceCode.getFirstToken(node, function (token) {
            return token.type === 'Keyword' && token.value === 'function';
          });
          var newToken = context.sourceCode.getFirstToken(node, function (token) {
            return token.type === 'Keyword' && token.value === 'new';
          });
          var text = isFunction(type) ? 'this function' : context.sourceCode.getText(callee);
          var loc = callee.type === 'FunctionExpression' ? functionToken.loc : callee.loc;
          context.report({
            message: (0, helpers_1.toEncodedMessage)(
              'Replace '.concat(text, ' with a constructor function.'),
              [newToken],
            ),
            loc: loc,
          });
        }
      },
    };
  },
};
function isInstantiable(type, signature, considerJSDoc) {
  return (
    isClass(type) ||
    isModule(type) ||
    isConstructor(type, signature, considerJSDoc) ||
    (type.isUnionOrIntersection() &&
      type.types.some(function (tp) {
        return isInstantiable(tp, signature, considerJSDoc);
      }))
  );
}
function isClass(type) {
  return (
    type.symbol &&
    ((type.symbol.flags & ts.SymbolFlags.Class) !== 0 ||
      (type.symbol.flags & ts.SymbolFlags.Type) !== 0)
  );
}
function isModule(type) {
  return type.symbol && (type.symbol.flags & ts.SymbolFlags.Module) !== 0;
}
function isFunction(type) {
  return type.symbol && (type.symbol.flags & ts.SymbolFlags.Function) !== 0;
}
function isConstructor(type, signature, considerJSDoc) {
  return isFunction(type) && (!considerJSDoc || hasJSDocAnnotation(signature));
}
function hasJSDocAnnotation(signature) {
  return signature === null || signature === void 0
    ? void 0
    : signature.getJsDocTags().some(function (tag) {
        return ['constructor', 'class'].includes(tag.name);
      });
}
function isAny(type) {
  return type.flags === ts.TypeFlags.Any;
}
