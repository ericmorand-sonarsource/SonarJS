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
/**
 * This file provides an API to take control over TypeScript's Program instances
 * in the context of program-based analysis for JavaScript / TypeScript.
 *
 * A TypeScript's Program instance is used by TypeScript ESLint parser in order
 * to make available TypeScript's type checker for rules willing to use type
 * information for the sake of precision. It works similarly as using TSConfigs
 * except it gives the control over the lifecycle of this internal data structure
 * used by the parser and improves performance.
 */
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
exports.writeTSConfigFile =
  exports.isRoot =
  exports.isRootNodeModules =
  exports.deleteProgram =
  exports.getProgramById =
  exports.createAndSaveProgram =
  exports.createProgram =
  exports.createProgramOptions =
    void 0;
var path_1 = __importDefault(require('path'));
var typescript_1 = __importDefault(require('typescript'));
var src_1 = require('../../../shared/src');
var tmp_1 = __importDefault(require('tmp'));
var util_1 = require('util');
var promises_1 = __importDefault(require('fs/promises'));
/**
 * Gets the files resolved by a TSConfig
 *
 * The resolving of the files for a given TSConfig file is done
 * by invoking TypeScript compiler.
 *
 * @param tsConfig TSConfig to parse
 * @param tsconfigContents TSConfig contents that we want to provide to TSConfig
 * @returns the resolved TSConfig files
 */
function createProgramOptions(tsConfig, tsconfigContents) {
  var missingTsConfig = false;
  var parseConfigHost = {
    useCaseSensitiveFileNames: true,
    readDirectory: typescript_1.default.sys.readDirectory,
    fileExists: function (file) {
      // When Typescript checks for the very last tsconfig.json, we will always return true,
      // If the file does not exist in FS, we will return an empty configuration
      if (isLastTsConfigCheck(file)) {
        return true;
      }
      return typescript_1.default.sys.fileExists(file);
    },
    readFile: function (file) {
      if (file === tsConfig && tsconfigContents) {
        return tsconfigContents;
      }
      var fileContents = typescript_1.default.sys.readFile(file);
      // When Typescript search for tsconfig which does not exist, return empty configuration
      // only when the check is for the last location at the root node_modules
      if (!fileContents && isLastTsConfigCheck(file)) {
        missingTsConfig = true;
        console.log(
          'WARN Could not find tsconfig.json: '.concat(
            file,
            '; falling back to an empty configuration.',
          ),
        );
        return '{}';
      }
      return fileContents;
    },
  };
  var config = typescript_1.default.readConfigFile(tsConfig, parseConfigHost.readFile);
  if (config.error) {
    (0, src_1.error)(
      'Failed to parse tsconfig: '
        .concat(tsConfig, ' (')
        .concat(diagnosticToString(config.error), ')'),
    );
    throw Error(diagnosticToString(config.error));
  }
  var parsedConfigFile = typescript_1.default.parseJsonConfigFileContent(
    config.config,
    parseConfigHost,
    path_1.default.resolve(path_1.default.dirname(tsConfig)),
    {
      noEmit: true,
    },
    tsConfig,
    undefined,
    [
      {
        extension: 'vue',
        isMixedContent: true,
        scriptKind: typescript_1.default.ScriptKind.Deferred,
      },
    ],
  );
  if (parsedConfigFile.errors.length > 0) {
    var message = parsedConfigFile.errors.map(diagnosticToString).join('; ');
    throw Error(message);
  }
  return {
    rootNames: parsedConfigFile.fileNames,
    options: __assign(__assign({}, parsedConfigFile.options), { allowNonTsExtensions: true }),
    projectReferences: parsedConfigFile.projectReferences,
    missingTsConfig: missingTsConfig,
  };
}
exports.createProgramOptions = createProgramOptions;
/**
 * Creates a TypeScript's Program instance
 *
 * TypeScript creates a Program instance per TSConfig file. This means that one
 * needs a TSConfig to create such a program. Therefore, the function expects a
 * TSConfig as an input, parses it and uses it to create a TypeScript's Program
 * instance. The program creation delegates to TypeScript the resolving of input
 * files considered by the TSConfig as well as any project references.
 *
 * @param tsConfig the TSConfig input to create a program for
 * @param tsconfigContents TSConfig contents that we want to provide to TSConfig
 * @returns the identifier of the created TypeScript's Program along with the
 *          program itself, the resolved files, project references and a boolean
 *          'missingTsConfig' which is true when an extended tsconfig.json path
 *          was not found, which defaulted to default Typescript configuration
 */
function createProgram(tsConfig, tsconfigContents) {
  var _a;
  if (!tsconfigContents) {
    tsconfigContents = (0, src_1.readFileSync)(tsConfig);
  }
  var programOptions = createProgramOptions(tsConfig, tsconfigContents);
  var program = typescript_1.default.createProgram(programOptions);
  var inputProjectReferences =
    (_a = program.getProjectReferences()) !== null && _a !== void 0 ? _a : [];
  var projectReferences = [];
  for (
    var _i = 0, inputProjectReferences_1 = inputProjectReferences;
    _i < inputProjectReferences_1.length;
    _i++
  ) {
    var reference = inputProjectReferences_1[_i];
    var sanitizedReference = (0, src_1.addTsConfigIfDirectory)(reference.path);
    if (!sanitizedReference) {
      (0, src_1.warn)('Skipping missing referenced tsconfig.json: '.concat(reference.path));
    } else {
      projectReferences.push(sanitizedReference);
    }
  }
  var files = program
    .getSourceFiles()
    .map(function (sourceFile) {
      return sourceFile.fileName;
    })
    .filter(exceptions);
  return {
    files: files,
    projectReferences: projectReferences,
    missingTsConfig: programOptions.missingTsConfig,
    program: program,
  };
  function exceptions(filename) {
    var _a = path_1.default.parse(filename),
      dir = _a.dir,
      ext = _a.ext;
    /* JSON files */
    if (ext === '.json') {
      return false;
    }
    /* Node modules */
    if ((0, src_1.toUnixPath)(dir).split('/').includes('node_modules')) {
      return false;
    }
    return true;
  }
}
exports.createProgram = createProgram;
/**
 * A cache of created TypeScript's Program instances
 *
 * It associates a program identifier to an instance of a TypeScript's Program.
 */
var programs = new Map();
/**
 * A counter of created TypeScript's Program instances
 */
var programCount = 0;
/**
 * Computes the next identifier available for a TypeScript's Program.
 * @returns
 */
function nextId() {
  programCount++;
  return programCount.toString();
}
/**
 * Creates a TypeScript's Program instance and saves it in memory
 *
 * To be removed once Java part does not handle program creation
 */
function createAndSaveProgram(tsConfig) {
  var program = createProgram(tsConfig);
  var programId = nextId();
  programs.set(programId, program.program);
  (0, src_1.debug)('program from '.concat(tsConfig, ' with id ').concat(programId, ' is created'));
  return __assign(__assign({}, program), { programId: programId });
}
exports.createAndSaveProgram = createAndSaveProgram;
/**
 * Gets an existing TypeScript's Program by its identifier
 * @param programId the identifier of the TypeScript's Program to retrieve
 * @throws a runtime error if there is no such program
 * @returns the retrieved TypeScript's Program
 */
function getProgramById(programId) {
  var program = programs.get(programId);
  if (!program) {
    throw Error('Failed to find program '.concat(programId));
  }
  return program;
}
exports.getProgramById = getProgramById;
/**
 * Deletes an existing TypeScript's Program by its identifier
 * @param programId the identifier of the TypeScript's Program to delete
 */
function deleteProgram(programId) {
  programs.delete(programId);
}
exports.deleteProgram = deleteProgram;
function diagnosticToString(diagnostic) {
  var _a;
  var text =
    typeof diagnostic.messageText === 'string'
      ? diagnostic.messageText
      : diagnostic.messageText.messageText;
  if (diagnostic.file) {
    return ''
      .concat(text, '  ')
      .concat((_a = diagnostic.file) === null || _a === void 0 ? void 0 : _a.fileName, ':')
      .concat(diagnostic.start);
  } else {
    return text;
  }
}
/**
 * Typescript resolution will always start searching by first looking for package.json files
 * starting in $TSCONFIG_PATH/package.json and on each parent until root folder.
 * 1 - $TSCONFIG_PATH/package.json
 * 2 - $TSCONFIG_PATH/../package.json
 * 3 - $TSCONFIG_PATH/../../package.json
 * ...
 * N - /package.json
 *
 * Then, Typescript resolution will always search for extended tsconfigs in these 5 paths (in order):
 *
 * 1 - $TSCONFIG_PATH/node_modules/$EXTENDED_TSCONFIG_VALUE/package.json
 * 2 - $TSCONFIG_PATH/node_modules/$EXTENDED_TSCONFIG_VALUE/../package.json
 * 3 - $TSCONFIG_PATH/node_modules/$EXTENDED_TSCONFIG_VALUE
 * 4 - $TSCONFIG_PATH/node_modules/$EXTENDED_TSCONFIG_VALUE.json
 * 5 - $TSCONFIG_PATH/node_modules/$EXTENDED_TSCONFIG_VALUE/tsconfig.json
 *
 * If not found in all 4, $TSCONFIG_PATH will be assigned to its parent and the same search will be performed,
 * until $TSCONFIG_PATH is the system root. Meaning, the very last search Typescript will perform is (5) when
 * TSCONFIG_PATH === '/':
 *
 * /node_modules/$EXTENDED_TSCONFIG_VALUE/tsconfig.json
 *
 * @param file
 */
function isLastTsConfigCheck(file) {
  return path_1.default.basename(file) === 'tsconfig.json' && isRootNodeModules(file);
}
function isRootNodeModules(file) {
  var root = process.platform === 'win32' ? file.slice(0, file.indexOf(':') + 1) : '/';
  var normalizedFile = (0, src_1.toUnixPath)(file);
  var topNodeModules = (0, src_1.toUnixPath)(
    path_1.default.resolve(path_1.default.join(root, 'node_modules')),
  );
  return normalizedFile.startsWith(topNodeModules);
}
exports.isRootNodeModules = isRootNodeModules;
function isRoot(file) {
  return (0, src_1.toUnixPath)(file) === (0, src_1.toUnixPath)(path_1.default.parse(file).root);
}
exports.isRoot = isRoot;
/**
 * Any temporary file created with the `tmp` library will be removed once the Node.js process terminates.
 */
tmp_1.default.setGracefulCleanup();
/**
 * Create the TSConfig file and returns its path.
 *
 * The file is written in a temporary location in the file system
 * and is marked to be removed after Node.js process terminates.
 *
 * @param tsConfig TSConfig to write
 * @returns the resolved TSConfig file path
 */
function writeTSConfigFile(tsConfig) {
  return __awaiter(this, void 0, void 0, function () {
    var filename;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          return [4 /*yield*/, (0, util_1.promisify)(tmp_1.default.file)()];
        case 1:
          filename = _a.sent();
          return [
            4 /*yield*/,
            promises_1.default.writeFile(filename, JSON.stringify(tsConfig), 'utf-8'),
          ];
        case 2:
          _a.sent();
          return [2 /*return*/, { filename: filename }];
      }
    });
  });
}
exports.writeTSConfigFile = writeTSConfigFile;
