'use strict';
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                  ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.PackageJsons = void 0;
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
var fs_1 = __importDefault(require('fs'));
var path_1 = __importDefault(require('path'));
var src_1 = require('../../../../shared/src');
var minimatch_1 = require('minimatch');
var PACKAGE_JSON = 'package.json';
// Patterns enforced to be ignored no matter what the user configures on sonar.properties
var IGNORED_PATTERNS = ['**/.scannerwork/**'];
var PackageJsons = /** @class */ (function () {
  function PackageJsons() {
    this.db = new Map();
  }
  /**
   * Look for package.json files in a given path and its child paths.
   * node_modules is ignored
   *
   * @param dir parent folder where the search starts
   * @param exclusions glob patterns to ignore while walking the tree
   */
  PackageJsons.prototype.searchPackageJsonFiles = function (dir, exclusions) {
    return __awaiter(this, void 0, void 0, function () {
      var patterns;
      return __generator(this, function (_a) {
        try {
          patterns = exclusions.concat(IGNORED_PATTERNS).map(function (exclusion) {
            return new minimatch_1.Minimatch(exclusion);
          });
          this.walkDirectory(path_1.default.posix.normalize((0, src_1.toUnixPath)(dir)), patterns);
        } catch (e) {
          (0, src_1.error)('Error while searching for package.json files: '.concat(e));
        }
        return [2 /*return*/];
      });
    });
  };
  PackageJsons.prototype.walkDirectory = function (dir, ignoredPatterns) {
    var files = fs_1.default.readdirSync(dir, { withFileTypes: true });
    var _loop_1 = function (file) {
      var filename = path_1.default.posix.join(dir, file.name);
      if (
        ignoredPatterns.some(function (pattern) {
          return pattern.match(filename);
        })
      ) {
        return 'continue';
      }
      if (file.isDirectory()) {
        this_1.walkDirectory(filename, ignoredPatterns);
      } else if (file.name.toLowerCase() === PACKAGE_JSON && !file.isDirectory()) {
        try {
          (0, src_1.debug)('Found package.json: '.concat(filename));
          var contents = JSON.parse((0, src_1.readFileSync)(filename));
          this_1.db.set(dir, { filename: filename, contents: contents });
        } catch (e) {
          (0, src_1.debug)('Error reading file '.concat(filename, ': ').concat(e));
        }
      }
    };
    var this_1 = this;
    for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
      var file = files_1[_i];
      _loop_1(file);
    }
  };
  /**
   * Given a filename, return all package.json files in the ancestor paths
   * ordered from nearest to furthest
   *
   * @param file source file for which we need a package.json
   */
  PackageJsons.prototype.getPackageJsonsForFile = function (file) {
    var results = [];
    if (this.db.size === 0) {
      return results;
    }
    var currentDir = path_1.default.posix.dirname(
      path_1.default.posix.normalize((0, src_1.toUnixPath)(file)),
    );
    do {
      var packageJson = this.db.get(currentDir);
      if (packageJson) {
        results.push(packageJson);
      }
      currentDir = path_1.default.posix.dirname(currentDir);
    } while (currentDir !== path_1.default.posix.dirname(currentDir));
    return results;
  };
  return PackageJsons;
})();
exports.PackageJsons = PackageJsons;
