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
var path_1 = __importDefault(require('path'));
var parser_1 = require('../../src/parser');
var src_1 = require('../../../shared/src');
var tape_1 = __importDefault(require('tape'));
var describe = tape_1.default;
describe('parseHtml', function (_a) {
  var it = _a.test;
  it('should return embedded JavaScript', function (_a) {
    var same = _a.same,
      end = _a.end;
    return __awaiter(void 0, void 0, void 0, function () {
      var filePath, fileContent, embeddedJSs, embeddedJS1, embeddedJS2;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            filePath = path_1.default.join(__dirname, 'fixtures', 'multiple.html');
            return [4 /*yield*/, (0, src_1.readFile)(filePath)];
          case 1:
            fileContent = _b.sent();
            embeddedJSs = (0, parser_1.parseHTML)(fileContent);
            same(embeddedJSs.length, 2);
            (embeddedJS1 = embeddedJSs[0]), (embeddedJS2 = embeddedJSs[1]);
            same(embeddedJS1, {
              code: 'f(x)',
              line: 4,
              column: 9,
              offset: 38,
              lineStarts: [0, 16, 23, 30, 52, 53, 69, 70, 92, 100, 108],
              text: fileContent,
              format: 'PLAIN',
              extras: {},
            });
            same(embeddedJS2, {
              code: 'g(x)',
              line: 8,
              column: 9,
              offset: 78,
              lineStarts: [0, 16, 23, 30, 52, 53, 69, 70, 92, 100, 108],
              text: fileContent,
              format: 'PLAIN',
              extras: {},
            });
            end();
            return [2 /*return*/];
        }
      });
    });
  });
  it('should ignore script tags with the "src" attribute', function (_a) {
    var same = _a.same,
      end = _a.end;
    return __awaiter(void 0, void 0, void 0, function () {
      var filePath, fileContent, embeddedJSs;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            filePath = path_1.default.join(__dirname, 'fixtures', 'src.html');
            return [4 /*yield*/, (0, src_1.readFile)(filePath)];
          case 1:
            fileContent = _b.sent();
            embeddedJSs = (0, parser_1.parseHTML)(fileContent);
            same(embeddedJSs.length, 0);
            end();
            return [2 /*return*/];
        }
      });
    });
  });
  it('should ignore non-js script tags', function (_a) {
    var same = _a.same,
      end = _a.end;
    return __awaiter(void 0, void 0, void 0, function () {
      var filePath, fileContent, embeddedJSs;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            filePath = path_1.default.join(__dirname, 'fixtures', 'non-js.html');
            return [4 /*yield*/, (0, src_1.readFile)(filePath)];
          case 1:
            fileContent = _b.sent();
            embeddedJSs = (0, parser_1.parseHTML)(fileContent);
            same(embeddedJSs.length, 0);
            end();
            return [2 /*return*/];
        }
      });
    });
  });
});
