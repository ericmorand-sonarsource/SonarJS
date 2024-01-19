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
// https://sonarsource.github.io/rspec/#/rspec/S4787/javascript
var __spreadArray =
  (this && this.__spreadArray) ||
  function (to, from, pack) {
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from));
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
var getEncryptionRuleModule = function (clientSideMethods, serverSideMethods) {
  return {
    meta: {
      messages: {
        safeEncryption: 'Make sure that encrypting data is safe here.',
      },
    },
    create: function (context) {
      // for client side
      var usingCryptoInFile = false;
      return {
        Program: function () {
          // init flag for each file
          usingCryptoInFile = false;
        },
        MemberExpression: function (node) {
          // detect 'SubtleCrypto' object
          // which can be retrieved by 'crypto.subtle' or 'window.crypto.subtle'
          var _a = node,
            object = _a.object,
            property = _a.property;
          if (
            (0, helpers_1.isIdentifier)(property, 'subtle') &&
            ((0, helpers_1.isIdentifier)(object, 'crypto') ||
              (0, helpers_1.isMemberWithProperty)(object, 'crypto'))
          ) {
            usingCryptoInFile = true;
          }
        },
        'CallExpression:exit': function (node) {
          var callee = node.callee;
          if (usingCryptoInFile) {
            // e.g.: crypto.subtle.encrypt()
            checkForClientSide(callee, context, clientSideMethods);
          }
          // e.g.
          // const crypto = require("crypto");
          // const cipher = crypto.createCipher(alg, key);
          checkForServerSide(callee, context, serverSideMethods);
        },
      };
    },
  };
};
function checkForServerSide(callee, context, serverSideMethods) {
  var fqn = (0, helpers_1.getFullyQualifiedName)(context, callee);
  if (
    serverSideMethods.some(function (method) {
      return fqn === 'crypto.'.concat(method);
    })
  ) {
    context.report({
      messageId: 'safeEncryption',
      node: callee,
    });
  }
}
function checkForClientSide(callee, context, clientSideMethods) {
  if (
    helpers_1.isIdentifier.apply(void 0, __spreadArray([callee], clientSideMethods, false)) ||
    helpers_1.isMemberWithProperty.apply(void 0, __spreadArray([callee], clientSideMethods, false))
  ) {
    context.report({
      messageId: 'safeEncryption',
      node: callee,
    });
  }
}
var clientSideEncryptMethods = ['encrypt', 'decrypt'];
var serverSideEncryptMethods = [
  'createCipher',
  'createCipheriv',
  'createDecipher',
  'createDecipheriv',
  'publicEncrypt',
  'publicDecrypt',
  'privateEncrypt',
  'privateDecrypt',
];
exports.rule = getEncryptionRuleModule(clientSideEncryptMethods, serverSideEncryptMethods);
