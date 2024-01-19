'use strict';
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.parseForESLint = void 0;
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
var src_1 = require('../../../shared/src');
var eslint_1 = require('eslint');
/**
 * Parses a JavaScript / TypeScript analysis input with an ESLint-based parser
 * @param code the JavaScript / TypeScript code to parse
 * @param parse the ESLint parsing function to use for parsing
 * @param options the ESLint parser options
 * @returns the parsed source code
 */
function parseForESLint(code, parse, options) {
  try {
    var result = parse(code, options);
    var parserServices = result.services || {};
    return new eslint_1.SourceCode(
      __assign(__assign({}, result), { text: code, parserServices: parserServices }),
    );
  } catch (_a) {
    var lineNumber = _a.lineNumber,
      message = _a.message;
    if (message.startsWith('Debug Failure')) {
      throw src_1.APIError.failingTypeScriptError(message);
    } else {
      throw src_1.APIError.parsingError(message, { line: lineNumber });
    }
  }
}
exports.parseForESLint = parseForESLint;
