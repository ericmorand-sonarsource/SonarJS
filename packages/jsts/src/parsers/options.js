'use strict';
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
exports.buildParserOptions = void 0;
/**
 * Builds ESLint parser options
 *
 * ESLint parser options allows for customizing the behaviour of
 * the ESLint-based parser used to parse JavaScript or TypeScript
 * code. It configures the ECMAScript version, specific syntax or
 * features to consider as valid during parsing, and additional
 * contents in the abstract syntax tree, among other things.
 *
 * @param initialOptions the analysis options to use
 * @param usingBabel a flag to indicate if we intend to parse with Babel
 * @returns the parser options for the input
 */
function buildParserOptions(initialOptions, usingBabel) {
  if (usingBabel === void 0) {
    usingBabel = false;
  }
  var options = __assign(
    {
      tokens: true,
      comment: true,
      loc: true,
      range: true,
      ecmaVersion: 2018,
      sourceType: 'module',
      codeFrame: false,
      ecmaFeatures: {
        jsx: true,
        globalReturn: false,
        legacyDecorators: true,
      },
      // for Vue parser
      extraFileExtensions: ['.vue'],
    },
    initialOptions,
  );
  if (usingBabel) {
    return babelParserOptions(options);
  }
  return options;
}
exports.buildParserOptions = buildParserOptions;
/**
 * Extends parser options with Babel's specific options
 *
 * Babel's parser is able to parse non-standard syntaxes and features.
 * However, the support of such constructs are extracted into dedicated
 * plugins, which need to be explictly included in the parser options,
 * among other things.
 *
 * @param options the parser options to extend
 * @returns the extend parser options
 */
function babelParserOptions(options) {
  var pluginPath = ''.concat(__dirname, '/../../../../node_modules');
  var babelOptions = {
    targets: 'defaults',
    presets: [
      ''.concat(pluginPath, '/@babel/preset-react'),
      ''.concat(pluginPath, '/@babel/preset-flow'),
      ''.concat(pluginPath, '/@babel/preset-env'),
    ],
    plugins: [
      [''.concat(pluginPath, '/@babel/plugin-proposal-decorators'), { version: '2022-03' }],
    ],
    babelrc: false,
    configFile: false,
    parserOpts: {
      allowReturnOutsideFunction: true,
    },
  };
  return __assign(__assign({}, options), { requireConfigFile: false, babelOptions: babelOptions });
}
