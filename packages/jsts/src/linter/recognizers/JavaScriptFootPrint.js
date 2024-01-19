'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.JavaScriptFootPrint = void 0;
var CamelCaseDetector_1 = __importDefault(require('./detectors/CamelCaseDetector'));
var ContainsDetector_1 = __importDefault(require('./detectors/ContainsDetector'));
var EndWithDetector_1 = __importDefault(require('./detectors/EndWithDetector'));
var KeywordsDetector_1 = __importDefault(require('./detectors/KeywordsDetector'));
var JavaScriptFootPrint = /** @class */ (function () {
  function JavaScriptFootPrint() {
    this.detectors = new Set();
    this.detectors.add(new EndWithDetector_1.default(0.95, '}', ';', '{'));
    this.detectors.add(new KeywordsDetector_1.default(0.7, '++', '||', '&&', '===', '?.', '??'));
    this.detectors.add(
      new KeywordsDetector_1.default(
        0.3,
        'public',
        'abstract',
        'class',
        'implements',
        'extends',
        'return',
        'throw',
        'private',
        'protected',
        'enum',
        'continue',
        'assert',
        'boolean',
        'this',
        'instanceof',
        'interface',
        'static',
        'void',
        'super',
        'true',
        'case:',
        'let',
        'const',
        'var',
        'async',
        'await',
        'break',
        'yield',
        'typeof',
        'import',
        'export',
      ),
    );
    this.detectors.add(
      new ContainsDetector_1.default(
        0.95,
        'for(',
        'if(',
        'while(',
        'catch(',
        'switch(',
        'try{',
        'else{',
        'this.',
        'window.',
        /;\s+\/\//,
        "import '",
        'import "',
        'require(',
      ),
    );
    this.detectors.add(new CamelCaseDetector_1.default(0.5));
  }
  JavaScriptFootPrint.prototype.getDetectors = function () {
    return this.detectors;
  };
  return JavaScriptFootPrint;
})();
exports.JavaScriptFootPrint = JavaScriptFootPrint;
