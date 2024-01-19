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
var path_1 = require('path');
var tools_1 = require('../../../jsts/tests/tools');
var parser_1 = require('../../src/parser');
var src_1 = require('../../../shared/src');
var src_2 = require('../../../jsts/src');
var tape_1 = __importDefault(require('tape'));
var describe = tape_1.default;
var beforeAll = function () {
  (0, src_1.setContext)({
    workDir: '/tmp/workdir',
    shouldUseTypeScriptParserForJS: true,
    sonarlint: false,
    bundles: [],
  });
};
describe('analyzeHTML', function (_a) {
  var it = _a.test;
  var fixturesPath = (0, path_1.join)(__dirname, 'fixtures');
  it('should analyze HTML file', function (_a) {
    var same = _a.same,
      end = _a.end;
    return __awaiter(void 0, void 0, void 0, function () {
      var issue, _b;
      return __generator(this, function (_c) {
        switch (_c.label) {
          case 0:
            beforeAll();
            (0,
            src_2.initializeLinter)([{ key: 'no-all-duplicated-branches', configurations: [], fileTypeTarget: ['MAIN'] }]);
            _b = src_2.analyzeEmbedded;
            return [
              4 /*yield*/,
              (0, tools_1.embeddedInput)({ filePath: (0, path_1.join)(fixturesPath, 'file.html') }),
            ];
          case 1:
            issue = _b.apply(void 0, [_c.sent(), parser_1.parseHTML]).issues[0];
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
            return [2 /*return*/];
        }
      });
    });
  });
  it('should not break when using a rule with a quickfix', function (_a) {
    var same = _a.same,
      end = _a.end;
    return __awaiter(void 0, void 0, void 0, function () {
      var result, _b, quickFix;
      return __generator(this, function (_c) {
        switch (_c.label) {
          case 0:
            beforeAll();
            (0,
            src_2.initializeLinter)([{ key: 'no-extra-semi', configurations: [], fileTypeTarget: ['MAIN'] }]);
            _b = src_2.analyzeEmbedded;
            return [
              4 /*yield*/,
              (0, tools_1.embeddedInput)({
                filePath: (0, path_1.join)(fixturesPath, 'quickfix.html'),
              }),
            ];
          case 1:
            result = _b.apply(void 0, [_c.sent(), parser_1.parseHTML]);
            quickFix = result.issues[0].quickFixes[0];
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
            return [2 /*return*/];
        }
      });
    });
  });
  it('should not break when using "enforce-trailing-comma" rule', function (_a) {
    var same = _a.same,
      end = _a.end;
    return __awaiter(void 0, void 0, void 0, function () {
      var issues, _b;
      return __generator(this, function (_c) {
        switch (_c.label) {
          case 0:
            beforeAll();
            (0, src_2.initializeLinter)([
              {
                key: 'enforce-trailing-comma',
                configurations: ['always-multiline'],
                fileTypeTarget: ['MAIN'],
              },
            ]);
            _b = src_2.analyzeEmbedded;
            return [
              4 /*yield*/,
              (0, tools_1.embeddedInput)({
                filePath: (0, path_1.join)(fixturesPath, 'enforce-trailing-comma.html'),
              }),
            ];
          case 1:
            issues = _b.apply(void 0, [_c.sent(), parser_1.parseHTML]).issues;
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
            return [2 /*return*/];
        }
      });
    });
  });
  it('should not break when using a rule with secondary locations', function (_a) {
    var same = _a.same,
      end = _a.end;
    return __awaiter(void 0, void 0, void 0, function () {
      var result, _b, secondaryLocation;
      return __generator(this, function (_c) {
        switch (_c.label) {
          case 0:
            beforeAll();
            (0,
            src_2.initializeLinter)([{ key: 'for-loop-increment-sign', configurations: [], fileTypeTarget: ['MAIN'] }]);
            _b = src_2.analyzeEmbedded;
            return [
              4 /*yield*/,
              (0, tools_1.embeddedInput)({
                filePath: (0, path_1.join)(fixturesPath, 'secondary.html'),
              }),
            ];
          case 1:
            result = _b.apply(void 0, [_c.sent(), parser_1.parseHTML]);
            secondaryLocation = result.issues[0].secondaryLocations[0];
            same(secondaryLocation, {
              line: 10,
              column: 18,
              endLine: 10,
              endColumn: 36,
            });
            end();
            return [2 /*return*/];
        }
      });
    });
  });
  it('should not break when using a regex rule', function (_a) {
    var same = _a.same,
      end = _a.end;
    return __awaiter(void 0, void 0, void 0, function () {
      var result, _b, issue;
      return __generator(this, function (_c) {
        switch (_c.label) {
          case 0:
            beforeAll();
            (0,
            src_2.initializeLinter)([{ key: 'sonar-no-regex-spaces', configurations: [], fileTypeTarget: ['MAIN'] }]);
            _b = src_2.analyzeEmbedded;
            return [
              4 /*yield*/,
              (0, tools_1.embeddedInput)({
                filePath: (0, path_1.join)(fixturesPath, 'regex.html'),
              }),
            ];
          case 1:
            result = _b.apply(void 0, [_c.sent(), parser_1.parseHTML]);
            issue = result.issues[0];
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
            return [2 /*return*/];
        }
      });
    });
  });
});
