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
// https://sonarsource.github.io/rspec/#/rspec/S1134/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var rule_1 = require('../S1135/rule');
var fixmePattern = 'fixme';
exports.rule = {
  meta: {
    messages: {
      fixme: 'Take the required action to fix the issue indicated by this comment.',
    },
  },
  create: function (context) {
    return {
      'Program:exit': function () {
        (0, rule_1.reportPatternInComment)(context, fixmePattern, 'fixme');
      },
    };
  },
};
