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
import path from 'path';
import { parseHTML } from '../../src/parser';
import { readFile } from '../../../shared/src';
import tape from 'tape';

const describe = tape;

describe('parseHtml', ({ test: it }) => {
  it('should return embedded JavaScript', async ({ same, end }) => {
    const filePath = path.join(__dirname, 'fixtures', 'multiple.html');
    const fileContent = await readFile(filePath);
    const embeddedJSs = parseHTML(fileContent);
    same(embeddedJSs.length, 2);
    const [embeddedJS1, embeddedJS2] = embeddedJSs;
    same(embeddedJS1, {
      code: 'f(x)',
      line: 4,
      column: 9,
      offset: 38,
      lineStarts: [0, 16, 23, 30, 52, 53, 69, 70, 92, 100, 108],
      text: fileContent,
      format: 'PLAIN',
      extras: {},
    });
    same(embeddedJS2, {
      code: 'g(x)',
      line: 8,
      column: 9,
      offset: 78,
      lineStarts: [0, 16, 23, 30, 52, 53, 69, 70, 92, 100, 108],
      text: fileContent,
      format: 'PLAIN',
      extras: {},
    });
    end();
  });

  it('should ignore script tags with the "src" attribute', async ({ same, end }) => {
    const filePath = path.join(__dirname, 'fixtures', 'src.html');
    const fileContent = await readFile(filePath);
    const embeddedJSs = parseHTML(fileContent);
    same(embeddedJSs.length, 0);
    end();
  });

  it('should ignore non-js script tags', async ({ same, end }) => {
    const filePath = path.join(__dirname, 'fixtures', 'non-js.html');
    const fileContent = await readFile(filePath);
    const embeddedJSs = parseHTML(fileContent);
    same(embeddedJSs.length, 0);
    end();
  });
});
