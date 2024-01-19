'use strict';
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
// https://sonarsource.github.io/rspec/#/rspec/S104/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var rule_1 = require('../S138/rule');
exports.rule = {
  meta: {
    messages: {
      maxFileLine:
        'This file has {{lineCount}} lines, which is greater than {{threshold}} authorized. Split it into smaller files.',
    },
    schema: [{ type: 'integer' }],
  },
  create: function (context) {
    var threshold = context.options[0];
    var sourceCode = context.sourceCode;
    var lines = sourceCode.lines;
    var commentLineNumbers = (0, rule_1.getCommentLineNumbers)(sourceCode.getAllComments());
    return {
      'Program:exit': function (node) {
        if (!node.loc) {
          return;
        }
        var lineCount = (0, rule_1.getLocsNumber)(node.loc, lines, commentLineNumbers);
        if (lineCount > threshold) {
          context.report({
            messageId: 'maxFileLine',
            data: {
              lineCount: lineCount.toString(),
              threshold: threshold,
            },
            loc: { line: 0, column: 0 },
          });
        }
      },
    };
  },
};
