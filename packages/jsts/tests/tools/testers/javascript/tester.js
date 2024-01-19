'use strict';
var __extends =
  (this && this.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== 'function' && b !== null)
        throw new TypeError('Class extends value ' + String(b) + ' is not a constructor or null');
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
    };
  })();
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
exports.JavaScriptRuleTester = void 0;
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
var eslint_1 = require('eslint');
var path = __importStar(require('path'));
var parser = path.resolve(
  ''.concat(__dirname, '/../../../../../../node_modules/@typescript-eslint/parser'),
);
var parserOptions = {
  ecmaVersion: 2018,
  sourceType: 'module',
  project: path.resolve(''.concat(__dirname, '/fixtures/tsconfig.json')),
};
var env = {
  es6: true,
};
var placeHolderFilePath = path.resolve(''.concat(__dirname, '/fixtures/placeholder.js'));
/**
 * Rule tester for JavaScript, using @typescript-eslint parser.
 */
var JavaScriptRuleTester = /** @class */ (function (_super) {
  __extends(JavaScriptRuleTester, _super);
  function JavaScriptRuleTester() {
    return (
      _super.call(this, {
        env: env,
        parser: parser,
        parserOptions: parserOptions,
      }) || this
    );
  }
  JavaScriptRuleTester.prototype.run = function (name, rule, tests) {
    var setFilename = function (test) {
      if (!test.filename) {
        test.filename = placeHolderFilePath;
      }
    };
    tests.valid.forEach(setFilename);
    tests.invalid.forEach(setFilename);
    _super.prototype.run.call(this, name, rule, tests);
  };
  return JavaScriptRuleTester;
})(eslint_1.RuleTester);
exports.JavaScriptRuleTester = JavaScriptRuleTester;
