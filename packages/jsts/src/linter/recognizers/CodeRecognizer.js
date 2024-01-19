'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.CodeRecognizer = void 0;
var CodeRecognizer = /** @class */ (function () {
  function CodeRecognizer(threshold, language) {
    this.language = language;
    this.threshold = threshold;
  }
  CodeRecognizer.prototype.recognition = function (line) {
    var probability = 0;
    for (var _i = 0, _a = this.language.getDetectors(); _i < _a.length; _i++) {
      var pattern = _a[_i];
      probability = 1 - (1 - probability) * (1 - pattern.recognition(line));
    }
    return probability;
  };
  CodeRecognizer.prototype.extractCodeLines = function (lines) {
    var _this = this;
    return lines.filter(function (line) {
      return _this.recognition(line) >= _this.threshold;
    });
  };
  CodeRecognizer.prototype.isLineOfCode = function (line) {
    return this.recognition(line) - this.threshold > 0;
  };
  return CodeRecognizer;
})();
exports.CodeRecognizer = CodeRecognizer;
