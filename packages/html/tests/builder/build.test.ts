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
import { join } from 'path';
import { parseHTML } from '../../src/parser';
import { embeddedInput } from '../../../jsts/tests/tools';
import { buildSourceCodes } from '../../../jsts/src';
import tape from 'tape';

const describe = tape;

describe('buildSourceCodes()', ({ test: it }) => {
  const fixturesPath = join(__dirname, 'fixtures');
  it('should build source codes from an HTML file', async ({ same, end }) => {
    const filePath = join(fixturesPath, 'multiple.html');
    const sourceCodes = buildSourceCodes(await embeddedInput({ filePath }), parseHTML);
    same(sourceCodes.length, 2);
    same(sourceCodes[0].ast.loc.start, { line: 4, column: 8 });
    same(sourceCodes[1].ast.loc.start, { line: 8, column: 8 });

    end();
  });
});
