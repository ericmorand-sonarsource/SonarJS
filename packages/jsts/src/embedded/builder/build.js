'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.composeSyntheticFilePath = exports.buildSourceCodes = void 0;
var builders_1 = require('../../builders');
var patch_1 = require('./patch');
var lodash_clone_1 = __importDefault(require('lodash.clone'));
var path_1 = __importDefault(require('path'));
/**
 * Builds ESLint SourceCode instances for every embedded JavaScript.
 *
 * In the case of AWS functions in YAML,
 * the filepath is augmented with the AWS function name, returned as the syntheticFilePath property
 *
 * If there is at least one parsing error in any snippet, we return only the first error and
 * we don't even consider any parsing errors in the remaining snippets for simplicity.
 */
function buildSourceCodes(input, languageParser) {
  var embeddedJSs = languageParser(input.fileContent);
  var extendedSourceCodes = [];
  for (var _i = 0, embeddedJSs_1 = embeddedJSs; _i < embeddedJSs_1.length; _i++) {
    var embeddedJS = embeddedJSs_1[_i];
    var code = embeddedJS.code;
    var syntheticFilePath = input.filePath;
    if (embeddedJS.extras.resourceName != null) {
      syntheticFilePath = composeSyntheticFilePath(input.filePath, embeddedJS.extras.resourceName);
    }
    /**
     * The file path is purposely left empty as it is ignored by `buildSourceCode` if
     * the file content is provided, which happens to be the case here since `code`
     * denotes an embedded JavaScript snippet extracted from the YAML file.
     */
    var jsTsAnalysisInput = {
      filePath: '',
      fileContent: code,
      fileType: 'MAIN',
    };
    try {
      var sourceCode = (0, builders_1.buildSourceCode)(jsTsAnalysisInput, 'js');
      var patchedSourceCode = (0, patch_1.patchSourceCode)(sourceCode, embeddedJS);
      // We use lodash.clone here to remove the effects of Object.preventExtensions()
      var extendedSourceCode = Object.assign((0, lodash_clone_1.default)(patchedSourceCode), {
        syntheticFilePath: syntheticFilePath,
      });
      extendedSourceCodes.push(extendedSourceCode);
    } catch (error) {
      throw (0, patch_1.patchParsingError)(error, embeddedJS);
    }
  }
  return extendedSourceCodes;
}
exports.buildSourceCodes = buildSourceCodes;
/**
 * Returns the filename composed as following:
 *
 * {filepath-without-extention}-{resourceName}{filepath-extension}
 */
function composeSyntheticFilePath(filePath, resourceName) {
  var _a = path_1.default.parse(filePath),
    dir = _a.dir,
    name = _a.name,
    ext = _a.ext;
  return path_1.default.format({
    dir: dir,
    name: ''.concat(name, '-').concat(resourceName),
    ext: ext,
  });
}
exports.composeSyntheticFilePath = composeSyntheticFilePath;
