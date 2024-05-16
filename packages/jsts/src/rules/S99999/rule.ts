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
// https://sonarsource.github.io/rspec/#/rspec/S99999/javascript

import * as estree from 'estree';
import { Rule } from 'eslint';
import { TSESTree } from '@typescript-eslint/utils';
import { writeFileSync } from 'fs';
import { join, parse } from 'path';
import { translateMethod, translateTopLevel } from '../../dbd/frontend/ir-generator';
import { FunctionInfo } from '../../dbd/ir-gen/ir_pb';
import { mkdirpSync } from 'mkdirp';
import { functionInto2Text } from '../../dbd/helpers';

export const rule: Rule.RuleModule = {
  meta: {
    messages: {
      message: 'Add an initial value to this "reduce()" call.',
    },
  },
  create(context: Rule.RuleContext) {
    const print = context.settings?.dbd?.print;
    const basename = parse(context.filename).name;
    const outputDir = print ? '' : context.settings?.dbd?.IRPath ?? join(__dirname, 'ir', 'python');
    if (!print) {
      mkdirpSync(outputDir);
    }

    let functionNo = 0;
    const saveResults = (result: FunctionInfo, methods: string[], functionIdentifier: string) => {
      if (print) {
        console.log(functionInto2Text(result));
        return;
      }
      const content = JSON.stringify(result.toJson({ emitDefaultValues: true }), null, 2);
      const fileNameBase = join(outputDir, `${basename}_${functionIdentifier}`);
      writeFileSync(`${fileNameBase}.json`, content, { flag: 'w' });
      writeFileSync(`${fileNameBase}.metadata`, [...methods].join('\n'), { flag: 'w' });
      writeFileSync(`${fileNameBase}.ir`, result.toBinary(), { flag: 'w' });
    };

    return {
      Program(node: estree.Node) {
        const result = translateTopLevel(context, node as TSESTree.Program);
        if (result) {
          saveResults(...result, 'main');
        }
      },
      'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression'(node: estree.Node) {
        const result = translateMethod(context, node as TSESTree.FunctionDeclaration);
        saveResults(...result, String(functionNo));
        functionNo++;
      },
    };
  },
};