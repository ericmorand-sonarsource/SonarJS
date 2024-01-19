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
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
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
var Detector_1 = __importDefault(require('../Detector'));
var CamelCaseDetector = /** @class */ (function (_super) {
  __extends(CamelCaseDetector, _super);
  function CamelCaseDetector() {
    return (_super !== null && _super.apply(this, arguments)) || this;
  }
  CamelCaseDetector.prototype.scan = function (line) {
    var previousChar = ' ';
    var currentChar;
    for (var i = 0; i < line.length; i++) {
      currentChar = line.charAt(i);
      if (isLowerCaseThenUpperCase(previousChar, currentChar)) {
        return 1;
      }
      previousChar = currentChar;
    }
    return 0;
  };
  return CamelCaseDetector;
})(Detector_1.default);
exports.default = CamelCaseDetector;
function isLowerCaseThenUpperCase(previousChar, char) {
  return isLowercase(previousChar) && isUpprcase(char);
  function isLowercase(char) {
    return char.toLowerCase() === char;
  }
  function isUpprcase(char) {
    return char.toUpperCase() === char;
  }
}
