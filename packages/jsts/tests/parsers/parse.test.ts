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
import { APIError, readFile } from '../../../shared/src';
import { buildParserOptions, parseForESLint, parsers } from '../../src/parsers';
import { JsTsAnalysisInput } from '../../src/analysis';
import path from 'path';
import { describe } from '../../../../tools/jest-to-tape-bridge';

const parseFunctions = [
  {
    parser: parsers.javascript,
    usingBabel: true,
    errorMessage: 'Unterminated string constant. (1:0)',
  },
  { parser: parsers.typescript, usingBabel: false, errorMessage: 'Unterminated string literal.' },
];

describe('parseForESLint', ({ it }) => {
  for (const testCase of parseFunctions) {
    it('should parse a valid input with $parser.parser', async ({ expect }) => {
      const { parser, usingBabel } = testCase;

      const filePath = path.join(__dirname, 'fixtures', 'parse', 'valid.js');
      const fileContent = await readFile(filePath);
      const fileType = 'MAIN';

      const input = { filePath, fileType, fileContent } as JsTsAnalysisInput;
      const options = buildParserOptions(input, usingBabel);
      const sourceCode = parseForESLint(fileContent, parser.parse, options);

      expect(sourceCode).toBeDefined();
      expect(sourceCode.ast).toBeDefined();
    });

    it('should parse a valid input with $parser.parser', async ({ expect }) => {
      const { parser, usingBabel } = testCase;

      const fileContent = 'if (foo()) bar();';
      const fileType = 'MAIN';

      const input = { fileContent, fileType } as JsTsAnalysisInput;
      const options = buildParserOptions(input, usingBabel);
      const sourceCode = parseForESLint(fileContent, parser.parse, options);

      expect(sourceCode).toBeDefined();
      expect(sourceCode.ast).toBeDefined();
    });

    it('should parse a valid input with $parser.parser', async ({ expect }) => {
      const { parser, usingBabel, errorMessage } = testCase;

      const filePath = path.join(__dirname, 'fixtures', 'parse', 'invalid.js');
      const fileContent = await readFile(filePath);
      const fileType = 'MAIN';

      const input = { filePath, fileType, fileContent } as JsTsAnalysisInput;
      const options = buildParserOptions(input, usingBabel);

      expect(() => parseForESLint(fileContent, parser.parse, options)).toThrow(
        APIError.parsingError(errorMessage, { line: 1 }),
      );
    });
  }
});
