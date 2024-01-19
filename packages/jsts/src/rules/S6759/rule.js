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
// https://sonarsource.github.io/rspec/#/rspec/S6759/javascript
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
      readOnlyProps: 'Mark the props of the component as read-only.',
      readOnlyPropsFix: 'Mark the props as read-only',
    },
  },
  create: function (context) {
    var services = context.sourceCode.parserServices;
    if (!(0, helpers_1.isRequiredParserServices)(services)) {
      return {};
    }
    var functionInfo = [];
    return {
      ':function': function () {
        functionInfo.push({ returns: [] });
      },
      ':function:exit': function (node) {
        /* Functional component */
        var info = functionInfo.pop();
        if (!info || !isFunctionalComponent(node, info)) {
          return;
        }
        /* Provides props */
        var props = node.params[0];
        if (!props) {
          return;
        }
        /* Includes type annotation */
        var typeAnnotation = props.typeAnnotation;
        if (!typeAnnotation) {
          return;
        }
        /* Read-only props */
        if (!isReadOnly(props, services)) {
          context.report({
            node: props,
            messageId: 'readOnlyProps',
            suggest: [
              {
                messageId: 'readOnlyPropsFix',
                fix: function (fixer) {
                  var tpe = typeAnnotation.typeAnnotation;
                  var oldText = context.sourceCode.getText(tpe);
                  var newText = 'Readonly<'.concat(oldText, '>');
                  return fixer.replaceText(tpe, newText);
                },
              },
            ],
          });
        }
      },
      ReturnStatement: function (node) {
        (0, helpers_1.last)(functionInfo).returns.push(node);
      },
    };
    /**
     * A function is considered to be a React functional component if it
     * is a named function declaration with a starting uppercase letter,
     * it takes at most one parameter, and it returns some JSX value.
     */
    function isFunctionalComponent(node, info) {
      /* Named function declaration */
      if (node.type !== 'FunctionDeclaration' || node.id === null) {
        return false;
      }
      /* Starts with uppercase */
      var name = node.id.name;
      if (!(name && /^[A-Z]/.test(name))) {
        return false;
      }
      /* At most one parameter (for props) */
      var paramCount = node.params.length;
      if (paramCount > 1) {
        return false;
      }
      /* Returns JSX value */
      var returns = info.returns;
      for (var _i = 0, returns_1 = returns; _i < returns_1.length; _i++) {
        var ret = returns_1[_i];
        if (!ret.argument) {
          continue;
        }
        var value = (0, helpers_1.getUniqueWriteUsageOrNode)(context, ret.argument);
        if (value.type.startsWith('JSX')) {
          return true;
        }
      }
      return false;
    }
    /**
     * A props type is considered to be read-only if the type annotation
     * is decorated with TypeScript utility type `Readonly` or if it refers
     * to a pure type declaration, i.e. where all its members are read-only.
     */
    function isReadOnly(props, services) {
      var tpe = (0, helpers_1.getTypeFromTreeNode)(props, services);
      /* Readonly utility type */
      var aliasSymbol = tpe.aliasSymbol;
      if (
        (aliasSymbol === null || aliasSymbol === void 0 ? void 0 : aliasSymbol.escapedName) ===
        'Readonly'
      ) {
        return true;
      }
      /* Resolve symbol definition */
      var symbol = tpe.getSymbol();
      if (!(symbol === null || symbol === void 0 ? void 0 : symbol.declarations)) {
        /* Kill the noise */
        return true;
      }
      /* Pure type declaration */
      var declarations = symbol.declarations;
      for (var _i = 0, declarations_1 = declarations; _i < declarations_1.length; _i++) {
        var decl = declarations_1[_i];
        if (ts.isInterfaceDeclaration(decl)) {
          var node = services.tsNodeToESTreeNodeMap.get(decl);
          if (
            (node === null || node === void 0 ? void 0 : node.type) === 'TSInterfaceDeclaration'
          ) {
            var members = node.body.body;
            if (
              members.every(function (m) {
                return m.type === 'TSPropertySignature' && m.readonly;
              })
            ) {
              return true;
            }
          }
        }
        if (ts.isTypeLiteralNode(decl)) {
          var node = services.tsNodeToESTreeNodeMap.get(decl);
          if ((node === null || node === void 0 ? void 0 : node.type) === 'TSTypeLiteral') {
            var members = node.members;
            if (
              members.every(function (m) {
                return m.type === 'TSPropertySignature' && m.readonly;
              })
            ) {
              return true;
            }
          }
        }
      }
      return false;
    }
  },
};
