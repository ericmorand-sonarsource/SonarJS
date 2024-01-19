'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.extractComments = void 0;
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
var builders_1 = require('../../../../../src/builders');
var eslint_1 = require('eslint');
/**
 *
 * @param fileContent
 * @param filePath
 * @returns
 */
function extractComments(fileContent, filePath) {
  var parsed = (0, builders_1.buildSourceCode)(
    { fileContent: fileContent, filePath: filePath, fileType: null, tsConfigs: [] },
    null,
  );
  var esTreeComments;
  if (parsed instanceof eslint_1.SourceCode) {
    esTreeComments = parsed.getAllComments();
  } else {
    throw Error('File not parseable: '.concat(fileContent));
  }
  return esTreeComments.map(function (c) {
    return {
      value: c.value,
      line: c.loc.start.line,
      column: c.loc.start.column + 2, // these offsets are everywhere down the road
      endLine: c.loc.end.line,
      endColumn: c.loc.end.column + 1, // same
    };
  });
}
exports.extractComments = extractComments;
