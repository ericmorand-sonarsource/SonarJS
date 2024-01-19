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
// https://sonarsource.github.io/rspec/#/rspec/S6544/javascript
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var typescript_eslint_1 = require('../typescript-eslint');
var core_1 = require('../core');
var helpers_1 = require('../helpers');
var locations_1 = require('eslint-plugin-sonarjs/lib/utils/locations');
/**
 * We keep a single occurence of issues raised by both rules, discarding the ones raised by 'no-async-promise-executor'
 * The current logic relies on the fact that the listener of 'no-misused-promises' runs first because
 * it is alphabetically "smaller", which is how we set them up in mergeRules.
 */
/**
 * start offsets of nodes that raised issues in typescript-eslint's no-misused-promises
 */
var flaggedNodeStarts = new Map();
var noMisusedPromisesRule = typescript_eslint_1.tsEslintRules['no-misused-promises'];
var decoratedNoMisusedPromisesRule = (0, helpers_1.interceptReport)(
  noMisusedPromisesRule,
  function (context, descriptor) {
    if ('node' in descriptor) {
      var node = descriptor.node;
      var start = node.range[0];
      if (!flaggedNodeStarts.get(start)) {
        flaggedNodeStarts.set(start, true);
        if (helpers_1.FUNCTION_NODES.includes(node.type)) {
          var loc = (0, locations_1.getMainFunctionTokenLocation)(node, node.parent, context);
          context.report(__assign(__assign({}, descriptor), { loc: loc }));
        } else {
          context.report(descriptor);
        }
      }
    }
  },
);
var noAsyncPromiseExecutorRule = core_1.eslintRules['no-async-promise-executor'];
var decoratedNoAsyncPromiseExecutorRule = (0, helpers_1.interceptReport)(
  noAsyncPromiseExecutorRule,
  function (context, descriptor) {
    if ('node' in descriptor) {
      var start = descriptor.node.range[0];
      if (!flaggedNodeStarts.get(start)) {
        context.report(descriptor);
      }
    }
  },
);
exports.rule = {
  meta: {
    messages: __assign(
      __assign({}, decoratedNoMisusedPromisesRule.meta.messages),
      decoratedNoAsyncPromiseExecutorRule.meta.messages,
    ),
    hasSuggestions: true,
  },
  create: function (context) {
    return __assign(
      {
        'Program:exit': function () {
          flaggedNodeStarts.clear();
        },
      },
      (0, helpers_1.mergeRules)(
        decoratedNoAsyncPromiseExecutorRule.create(context),
        decoratedNoMisusedPromisesRule.create(context),
      ),
    );
  },
};
