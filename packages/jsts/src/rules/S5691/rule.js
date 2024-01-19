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
// https://sonarsource.github.io/rspec/#/rspec/S5691/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
var SERVE_STATIC = 'serve-static';
exports.rule = {
  meta: {
    messages: {
      safeHiddenFile: 'Make sure serving hidden files is safe here.',
    },
  },
  create: function (context) {
    return {
      CallExpression: function (node) {
        // serveStatic(...)
        var _a = node,
          callee = _a.callee,
          args = _a.arguments;
        if (
          (0, helpers_1.getFullyQualifiedName)(context, callee) === SERVE_STATIC &&
          args.length > 1
        ) {
          var options = args[1];
          if (options.type === 'Identifier') {
            options = (0, helpers_1.getUniqueWriteUsage)(context, options.name);
          }
          var dotfilesProperty = (0, helpers_1.getObjectExpressionProperty)(options, 'dotfiles');
          if (
            (dotfilesProperty === null || dotfilesProperty === void 0
              ? void 0
              : dotfilesProperty.value.type) === 'Literal' &&
            dotfilesProperty.value.value === 'allow'
          ) {
            context.report({ node: dotfilesProperty, messageId: 'safeHiddenFile' });
          }
        }
      },
    };
  },
};
