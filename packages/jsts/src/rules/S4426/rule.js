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
// https://sonarsource.github.io/rspec/#/rspec/S4426/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
var MINIMAL_MODULUS_LENGTH = 2048;
var MINIMAL_DIVISOR_LENGTH = 224;
var WEAK_CURVES = [
  'secp112r1',
  'secp112r2',
  'secp128r1',
  'secp128r2',
  'secp160k1',
  'secp160r1',
  'secp160r2',
  'secp160r2',
  'secp192k1',
  'secp192r1',
  'prime192v2',
  'prime192v3',
  'sect113r1',
  'sect113r2',
  'sect131r1',
  'sect131r2',
  'sect163k1',
  'sect163r1',
  'sect163r2',
  'sect193r1',
  'sect193r2',
  'c2tnb191v1',
  'c2tnb191v2',
  'c2tnb191v3',
];
exports.rule = {
  meta: {
    messages: {
      modulusLength:
        'Use a modulus length of at least {{minimalLength}} bits for {{algorithm}} cipher algorithm.',
      divisorLength:
        'Use a divisor length of at least {{minimalLength}} bits for {{algorithm}} cipher algorithm.',
      strongerCurve: "{{curve}} doesn't provide enough security. Use a stronger curve.",
    },
  },
  create: function (context) {
    function getNumericValue(node) {
      var literal = (0, helpers_1.getValueOfExpression)(context, node, 'Literal');
      if (literal && typeof literal.value === 'number') {
        return literal.value;
      }
      return undefined;
    }
    function checkRsaAndDsaOptions(algorithm, options) {
      var modulusProperty = (0, helpers_1.getObjectExpressionProperty)(options, 'modulusLength');
      var modulusLength = getNumericValue(
        modulusProperty === null || modulusProperty === void 0 ? void 0 : modulusProperty.value,
      );
      if (modulusProperty && modulusLength && modulusLength < MINIMAL_MODULUS_LENGTH) {
        context.report({
          node: modulusProperty,
          messageId: 'modulusLength',
          data: {
            minimalLength: MINIMAL_MODULUS_LENGTH.toString(),
            algorithm: algorithm,
          },
        });
      }
      var divisorProperty = (0, helpers_1.getObjectExpressionProperty)(options, 'divisorLength');
      var divisorLength = getNumericValue(
        divisorProperty === null || divisorProperty === void 0 ? void 0 : divisorProperty.value,
      );
      if (divisorProperty && divisorLength && divisorLength < MINIMAL_DIVISOR_LENGTH) {
        context.report({
          node: divisorProperty,
          messageId: 'divisorLength',
          data: {
            minimalLength: MINIMAL_DIVISOR_LENGTH.toString(),
            algorithm: algorithm,
          },
        });
      }
    }
    function checkEcCurve(options) {
      var _a, _b;
      var namedCurveProperty = (0, helpers_1.getObjectExpressionProperty)(options, 'namedCurve');
      var namedCurve =
        (_b =
          (_a = (0, helpers_1.getValueOfExpression)(
            context,
            namedCurveProperty === null || namedCurveProperty === void 0
              ? void 0
              : namedCurveProperty.value,
            'Literal',
          )) === null || _a === void 0
            ? void 0
            : _a.value) === null || _b === void 0
          ? void 0
          : _b.toString();
      if (namedCurveProperty && namedCurve && WEAK_CURVES.includes(namedCurve)) {
        context.report({
          node: namedCurveProperty,
          messageId: 'strongerCurve',
          data: {
            curve: namedCurve,
          },
        });
      }
    }
    return {
      CallExpression: function (node) {
        var _a;
        var callExpression = node;
        var callee = callExpression.callee;
        if (
          callee.type === 'MemberExpression' &&
          (0, helpers_1.isIdentifier)(callee.property, 'generateKeyPair', 'generateKeyPairSync')
        ) {
          if (callExpression.arguments.length < 2) {
            return;
          }
          var _b = callExpression.arguments,
            algorithmArg = _b[0],
            options = _b[1];
          var optionsArg = (0, helpers_1.getValueOfExpression)(
            context,
            options,
            'ObjectExpression',
          );
          if (!optionsArg) {
            return;
          }
          var algorithm =
            (_a = (0, helpers_1.getValueOfExpression)(context, algorithmArg, 'Literal')) === null ||
            _a === void 0
              ? void 0
              : _a.value;
          if (algorithm === 'rsa' || algorithm === 'dsa') {
            checkRsaAndDsaOptions(algorithm, optionsArg);
          } else if (algorithm === 'ec') {
            checkEcCurve(optionsArg);
          }
        }
      },
    };
  },
};
