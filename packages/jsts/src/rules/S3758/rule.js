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
// https://sonarsource.github.io/rspec/#/rspec/S3758/javascript
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
var comparisonOperators = new Set(['>', '<', '>=', '<=']);
exports.rule = {
  meta: {
    messages: {
      reEvaluateDataFlow:
        'Re-evaluate the data flow; this operand of a numeric comparison could be of type {{type}}.',
    },
  },
  create: function (context) {
    var services = context.sourceCode.parserServices;
    if (!(0, helpers_1.isRequiredParserServices)(services)) {
      return {};
    }
    return {
      BinaryExpression: function (node) {
        var _a = node,
          left = _a.left,
          operator = _a.operator,
          right = _a.right;
        if (!comparisonOperators.has(operator)) {
          return;
        }
        if (left.type === 'MemberExpression' || right.type === 'MemberExpression') {
          // avoid FPs on field access
          return;
        }
        var checker = services.program.getTypeChecker();
        var leftType = (0, helpers_1.getTypeFromTreeNode)(left, services);
        var rightType = (0, helpers_1.getTypeFromTreeNode)(right, services);
        if ((0, helpers_1.isStringType)(leftType) || (0, helpers_1.isStringType)(rightType)) {
          return;
        }
        var isLeftConvertibleToNumber = isConvertibleToNumber(leftType, checker);
        var isRightConvertibleToNumber = isConvertibleToNumber(rightType, checker);
        if (!isLeftConvertibleToNumber) {
          context.report({
            messageId: 'reEvaluateDataFlow',
            data: {
              type: checker.typeToString(leftType),
            },
            node: left,
          });
        }
        if (!isRightConvertibleToNumber) {
          context.report({
            messageId: 'reEvaluateDataFlow',
            data: {
              type: checker.typeToString(rightType),
            },
            node: right,
          });
        }
      },
    };
  },
};
function isConvertibleToNumber(typ, checker) {
  var flags = typ.getFlags();
  if ((flags & ts.TypeFlags.BooleanLike) !== 0) {
    return true;
  }
  if ((flags & ts.TypeFlags.Undefined) !== 0) {
    return false;
  }
  var valueOfSignatures = getValueOfSignatures(typ, checker);
  return (
    valueOfSignatures.length === 0 ||
    valueOfSignatures.some(function (signature) {
      var returnType = signature.getReturnType();
      return (0, helpers_1.isNumberType)(returnType) || (0, helpers_1.isBigIntType)(returnType);
    })
  );
}
function getValueOfSignatures(typ, checker) {
  var _a;
  var valueOfSymbol = typ.getProperty('valueOf');
  if (!valueOfSymbol) {
    return [];
  }
  var declarations = (_a = valueOfSymbol.getDeclarations()) !== null && _a !== void 0 ? _a : [];
  return declarations
    .map(function (declaration) {
      return checker.getTypeAtLocation(declaration).getCallSignatures();
    })
    .reduce(function (result, decl) {
      return result.concat(decl);
    }, []);
}
