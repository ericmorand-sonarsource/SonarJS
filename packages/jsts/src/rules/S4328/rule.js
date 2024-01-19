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
// https://sonarsource.github.io/rspec/#/rspec/S4328/javascript
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod)
        if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var builtin_modules_1 = __importDefault(require('builtin-modules'));
var path = __importStar(require('path'));
var fs = __importStar(require('fs'));
var ts = __importStar(require('typescript'));
var src_1 = require('../../../src');
exports.rule = {
  meta: {
    messages: {
      removeOrAddDependency: 'Either remove this import or add it as a dependency.',
    },
  },
  create: function (context) {
    var whitelist = context.options;
    var dependencies = (0, src_1.getDependencies)(context.filename);
    var aliasedPathsMappingPatterns = extractPathMappingPatterns(context.sourceCode.parserServices);
    var baseUrl = getBaseUrl(context.sourceCode.parserServices);
    if (aliasedPathsMappingPatterns === 'matchAll') {
      // deactivates this rule altogether.
      return {};
    }
    return {
      CallExpression: function (node) {
        var call = node;
        if (
          call.callee.type === 'Identifier' &&
          call.callee.name === 'require' &&
          call.arguments.length === 1
        ) {
          var argument = call.arguments[0];
          if (argument.type === 'Literal') {
            var requireToken = call.callee;
            raiseOnImplicitImport(
              argument,
              requireToken.loc,
              dependencies,
              whitelist,
              aliasedPathsMappingPatterns,
              baseUrl,
              context,
            );
          }
        }
      },
      ImportDeclaration: function (node) {
        var module = node.source;
        var importToken = context.sourceCode.getFirstToken(node);
        raiseOnImplicitImport(
          module,
          importToken.loc,
          dependencies,
          whitelist,
          aliasedPathsMappingPatterns,
          baseUrl,
          context,
        );
      },
    };
  },
};
function raiseOnImplicitImport(
  module,
  loc,
  dependencies,
  whitelist,
  aliasedPathsMappingPatterns,
  baseUrl,
  context,
) {
  var moduleName = module.value;
  if (typeof moduleName !== 'string') {
    return;
  }
  if (ts.isExternalModuleNameRelative(moduleName)) {
    return;
  }
  if (
    aliasedPathsMappingPatterns.some(function (pattern) {
      return pattern.isApplicableTo(moduleName);
    })
  ) {
    return;
  }
  if (
    ['node:', 'data:', 'file:'].some(function (prefix) {
      return moduleName.startsWith(prefix);
    })
  ) {
    return;
  }
  if (baseUrl) {
    var underBaseUrlPath_1 = path.join(baseUrl, moduleName);
    var extensions = ['', '.ts', '.d.ts', '.tsx', '.js', '.jsx', '.vue', '.mjs'];
    if (
      extensions.some(function (extension) {
        return fs.existsSync(underBaseUrlPath_1 + extension);
      })
    ) {
      return;
    }
  }
  var packageName = getPackageName(moduleName);
  if (
    !whitelist.includes(packageName) &&
    !builtin_modules_1.default.includes(packageName) &&
    !dependencies.has(packageName)
  ) {
    context.report({
      messageId: 'removeOrAddDependency',
      loc: loc,
    });
  }
}
function getPackageName(name) {
  /*
      - scoped `@namespace/foo/bar` -> package `@namespace/foo`
      - scope `foo/bar` -> package `foo`
    */
  var parts = name.split('/');
  if (!name.startsWith('@')) {
    return parts[0];
  } else {
    return ''.concat(parts[0], '/').concat(parts[1]);
  }
}
var PathMappingNoAsteriskPattern = /** @class */ (function () {
  function PathMappingNoAsteriskPattern(value) {
    this.value = value;
  }
  PathMappingNoAsteriskPattern.prototype.isApplicableTo = function (name) {
    return name === this.value;
  };
  return PathMappingNoAsteriskPattern;
})();
var PathMappingSingleAsteriskPattern = /** @class */ (function () {
  function PathMappingSingleAsteriskPattern(prefix, suffix) {
    this.prefix = prefix;
    this.suffix = suffix;
  }
  PathMappingSingleAsteriskPattern.prototype.isApplicableTo = function (name) {
    return name.startsWith(this.prefix) && name.endsWith(this.suffix);
  };
  return PathMappingSingleAsteriskPattern;
})();
var PATH_MAPPING_ASTERISK_PATTERN = /^([^*]*)\*([^*]*)$/; // matches any string with single asterisk '*'
var PATH_MAPPING_ASTERISK_PATTERN_PREFIX_IDX = 1;
var PATH_MAPPING_ASTERISK_PATTERN_SUFFIX_IDX = 2;
function extractPathMappingPatterns(parserServices) {
  var _a, _b;
  var compilerOptions =
    (_a = parserServices.program) === null || _a === void 0 ? void 0 : _a.getCompilerOptions();
  var paths =
    (_b =
      compilerOptions === null || compilerOptions === void 0 ? void 0 : compilerOptions.paths) !==
      null && _b !== void 0
      ? _b
      : [];
  var pathMappingPatterns = [];
  for (var p in paths) {
    if (p === '*') {
      return 'matchAll';
    } else {
      var m = p.match(PATH_MAPPING_ASTERISK_PATTERN);
      if (m) {
        pathMappingPatterns.push(
          new PathMappingSingleAsteriskPattern(
            m[PATH_MAPPING_ASTERISK_PATTERN_PREFIX_IDX],
            m[PATH_MAPPING_ASTERISK_PATTERN_SUFFIX_IDX],
          ),
        );
      } else if (!p.includes('*')) {
        pathMappingPatterns.push(new PathMappingNoAsteriskPattern(p));
      } else {
        // This case should not occur: `tsc` emits error if there is more than one asterisk
      }
    }
  }
  return pathMappingPatterns;
}
function getBaseUrl(parserServices) {
  var _a;
  return (_a = parserServices.program) === null || _a === void 0
    ? void 0
    : _a.getCompilerOptions().baseUrl;
}
