'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.Range = void 0;
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
var Range = /** @class */ (function () {
  function Range(line, column, endLine, endColumn) {
    this.line = line;
    this.column = column;
    this.endLine = endLine;
    this.endColumn = endColumn;
  }
  Range.prototype.toLocationHolder = function () {
    return {
      loc: {
        start: { line: this.line, column: this.column },
        end: { line: this.endLine, column: this.endColumn },
      },
    };
  };
  Range.prototype.toString = function () {
    return '('
      .concat(this.line, ':')
      .concat(this.column, ',')
      .concat(this.endLine, ':')
      .concat(this.endColumn, ')');
  };
  return Range;
})();
exports.Range = Range;
