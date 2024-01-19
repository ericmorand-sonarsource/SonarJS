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
var rule_diagnostics_1 = require('./rule.diagnostics');
var eslint_plugin_react_1 = require('eslint-plugin-react');
var helpers_1 = require('../helpers');
var src_1 = require('../../../src');
var reactNoDeprecated = eslint_plugin_react_1.rules['no-deprecated'];
exports.rule = {
  meta: {
    messages: __assign(
      { deprecated: '{{oldMethod}} is deprecated since React {{version}}{{newMethod}}' },
      rule_diagnostics_1.rule.meta.messages,
    ),
  },
  create: function (context) {
    function getVersionFromOptions() {
      var _a, _b;
      return (_b = (_a = context.options) === null || _a === void 0 ? void 0 : _a[0]) === null ||
        _b === void 0
        ? void 0
        : _b['react-version'];
    }
    function getVersionFromPackageJson() {
      var _a, _b;
      for (
        var _i = 0, _c = (0, src_1.getNearestPackageJsons)(context.filename);
        _i < _c.length;
        _i++
      ) {
        var packageJson = _c[_i].contents;
        if ((_a = packageJson.dependencies) === null || _a === void 0 ? void 0 : _a.react) {
          return packageJson.dependencies.react;
        }
        if ((_b = packageJson.devDependencies) === null || _b === void 0 ? void 0 : _b.react) {
          return packageJson.devDependencies.react;
        }
      }
      return null;
    }
    var reactVersion = getVersionFromOptions() || getVersionFromPackageJson();
    var patchedContext = reactVersion
      ? Object.create(context, {
          settings: {
            value: { react: { version: reactVersion } },
            writable: false,
          },
        })
      : context;
    return (0, helpers_1.mergeRules)(
      reactNoDeprecated.create(patchedContext),
      rule_diagnostics_1.rule.create(context),
    );
  },
};
