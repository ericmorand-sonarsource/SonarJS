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
import { embeddedInput } from '../../../jsts/tests/tools';
import { parseHTML } from '../../src/parser';
import { setContext } from '../../../shared/src';
import { analyzeEmbedded, initializeLinter } from '../../../jsts/src';
import tape from 'tape';

const describe = tape;

const beforeAll = () => {
  setContext({
    workDir: '/tmp/workdir',
    shouldUseTypeScriptParserForJS: true,
    sonarlint: false,
    bundles: [],
  });
};

describe('analyzeHTML', ({ test: it }) => {
  const fixturesPath = join(__dirname, 'fixtures');

  it('should analyze HTML file', async ({ same, end }) => {
    beforeAll();

    initializeLinter([
      { key: 'no-all-duplicated-branches', configurations: [], fileTypeTarget: ['MAIN'] },
    ]);
    const {
      issues: [issue],
    } = analyzeEmbedded(
      await embeddedInput({ filePath: join(fixturesPath, 'file.html') }),
      parseHTML,
    );
    same(issue, {
      ruleId: 'no-all-duplicated-branches',
      line: 10,
      column: 2,
      endLine: 10,
      endColumn: 31,
      message:
        "Remove this conditional structure or edit its code blocks so that they're not all the same.",
      quickFixes: [],
      secondaryLocations: [],
    });

    end();
  });

  it('should not break when using a rule with a quickfix', async ({ same, end }) => {
    beforeAll();
    initializeLinter([{ key: 'no-extra-semi', configurations: [], fileTypeTarget: ['MAIN'] }]);
    const result = analyzeEmbedded(
      await embeddedInput({ filePath: join(fixturesPath, 'quickfix.html') }),
      parseHTML,
    );

    const {
      issues: [
        {
          // @ts-ignore
          quickFixes: [quickFix],
        },
      ],
    } = result;
    same(quickFix.edits, [
      {
        text: ';',
        loc: {
          line: 10,
          column: 42,
          endLine: 10,
          endColumn: 44,
        },
      },
    ]);

    end();
  });

  it('should not break when using "enforce-trailing-comma" rule', async ({ same, end }) => {
    beforeAll();
    initializeLinter([
      {
        key: 'enforce-trailing-comma',
        configurations: ['always-multiline'],
        fileTypeTarget: ['MAIN'],
      },
    ]);
    const { issues } = analyzeEmbedded(
      await embeddedInput({ filePath: join(fixturesPath, 'enforce-trailing-comma.html') }),
      parseHTML,
    );
    same(issues.length, 2);
    same(issues[0], {
      ruleId: 'enforce-trailing-comma',
      line: 13,
      column: 16,
      endLine: 14,
      endColumn: 0,
      message: 'Missing trailing comma.',
      quickFixes: [],
      secondaryLocations: [],
    });

    same(issues[1], {
      ruleId: 'enforce-trailing-comma',
      line: 14,
      column: 7,
      endLine: 15,
      endColumn: 0,
      message: 'Missing trailing comma.',
      quickFixes: [],
      secondaryLocations: [],
    });

    end();
  });

  it('should not break when using a rule with secondary locations', async ({ same, end }) => {
    beforeAll();
    initializeLinter([
      { key: 'for-loop-increment-sign', configurations: [], fileTypeTarget: ['MAIN'] },
    ]);
    const result = analyzeEmbedded(
      await embeddedInput({ filePath: join(fixturesPath, 'secondary.html') }),
      parseHTML,
    );
    const {
      issues: [
        {
          secondaryLocations: [secondaryLocation],
        },
      ],
    } = result;
    same(secondaryLocation, {
      line: 10,
      column: 18,
      endLine: 10,
      endColumn: 36,
    });

    end();
  });

  it('should not break when using a regex rule', async ({ same, end }) => {
    beforeAll();
    initializeLinter([
      { key: 'sonar-no-regex-spaces', configurations: [], fileTypeTarget: ['MAIN'] },
    ]);
    const result = analyzeEmbedded(
      await embeddedInput({ filePath: join(fixturesPath, 'regex.html') }),
      parseHTML,
    );
    const {
      issues: [issue],
    } = result;
    same(issue, {
      ruleId: 'sonar-no-regex-spaces',
      line: 10,
      column: 25,
      endLine: 10,
      endColumn: 28,
      message: 'If multiple spaces are required here, use number quantifier ({3}).',
      quickFixes: [],
      secondaryLocations: [],
    });

    end();
  });
});
