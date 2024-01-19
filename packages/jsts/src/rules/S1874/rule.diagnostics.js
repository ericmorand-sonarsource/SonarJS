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
// https://sonarsource.github.io/rspec/#/rspec/S1874/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
exports.rule = {
  meta: {
    messages: {
      deprecation: '{{deprecation}}',
    },
  },
  create: function (context) {
    var services = context.sourceCode.parserServices;
    if (!(0, helpers_1.isRequiredParserServices)(services)) {
      return {};
    }
    return {
      Program: function () {
        var program = services.program;
        var checker = program.getTypeChecker();
        var sourceFile = program.getSourceFile(context.filename);
        var diagnostics =
          // @ts-ignore: TypeChecker#getSuggestionDiagnostics is not publicly exposed
          checker.getSuggestionDiagnostics(sourceFile);
        for (var _i = 0, diagnostics_1 = diagnostics; _i < diagnostics_1.length; _i++) {
          var diagnostic = diagnostics_1[_i];
          if (diagnostic.reportsDeprecated === true) {
            var sourceCode = context.sourceCode;
            var start = sourceCode.getLocFromIndex(diagnostic.start);
            var end = sourceCode.getLocFromIndex(diagnostic.start + diagnostic.length);
            var loc = { start: start, end: end };
            context.report({
              loc: loc,
              messageId: 'deprecation',
              data: {
                deprecation: diagnostic.messageText,
              },
            });
          }
        }
      },
    };
  },
};
