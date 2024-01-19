'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.extractQuickFixes =
  exports.isQuickfixLine =
  exports.QuickFix =
  exports.QUICKFIX_ID =
  exports.QUICKFIX_SEPARATOR =
    void 0;
var locations_1 = require('./locations');
var STARTS_WITH_QUICKFIX = /^ *(edit|del|add|fix)@/;
exports.QUICKFIX_SEPARATOR = '[,\\s]+';
exports.QUICKFIX_ID =
  '\\[\\[(?<quickfixes>\\w+(=\\d+)?!?(?:' +
  exports.QUICKFIX_SEPARATOR +
  '(?:\\w+(=\\d+)?!?))*)\\]\\]';
var QUICKFIX_DESCRIPTION_PATTERN = RegExp(
  ' *' +
    // quickfix description, ex: fix@qf1 {{Replace with foo}}
    'fix@(?<quickfixId>\\w+)' +
    // message, ex: {{msg}}
    ' *(?:\\{\\{(?<message>.*?)\\}\\}(?!\\}))? *' +
    '(?:\\r(\\n?)|\\n)?',
);
var QUICKFIX_CHANGE_PATTERN = RegExp(
  ' *' +
    // quickfix edit, ex: edit@qf1
    '(?<type>edit|add|del)@(?<quickfixId>\\w+)' +
    locations_1.LINE_ADJUSTMENT +
    // start and end columns, ex: [[sc=1;ec=5]] both are optional
    ' *(?:\\[\\[' +
    '(?<firstColumnType>sc|ec)=(?<firstColumnValue>\\d+)(?:;(?<secondColumnType>sc|ec)=(?<secondColumnValue>\\d+))?' +
    '\\]\\])?' +
    // contents to be applied, ex: {{foo}}
    ' *(?:\\{\\{(?<contents>.*?)\\}\\}(?!\\}))?' +
    ' *(?:\\r(\\n?)|\\n)?',
);
var QuickFix = /** @class */ (function () {
  function QuickFix(id, mandatory, messageIndex, lineIssues) {
    this.id = id;
    this.mandatory = mandatory;
    this.messageIndex = messageIndex;
    this.lineIssues = lineIssues;
    this.changes = [];
    this.description = undefined;
  }
  return QuickFix;
})();
exports.QuickFix = QuickFix;
function isQuickfixLine(comment) {
  return STARTS_WITH_QUICKFIX.test(comment);
}
exports.isQuickfixLine = isQuickfixLine;
function extractQuickFixes(quickfixes, comment) {
  var _a;
  if (QUICKFIX_DESCRIPTION_PATTERN.test(comment.value)) {
    var matches = QUICKFIX_DESCRIPTION_PATTERN.exec(comment.value);
    var _b = matches.groups,
      quickfixId = _b.quickfixId,
      message = _b.message;
    var quickfix = quickfixes.get(quickfixId);
    if (!quickfix) {
      throw new Error(
        "Unexpected quickfix ID '"
          .concat(quickfixId, "' found at ")
          .concat(comment.line, ':')
          .concat(comment.column),
      );
    } else if (quickfix.mandatory) {
      throw new Error("ESLint fix '".concat(quickfixId, "' does not require description message"));
    }
    quickfix.description = message;
  } else if (QUICKFIX_CHANGE_PATTERN.test(comment.value)) {
    var matches = QUICKFIX_CHANGE_PATTERN.exec(comment.value);
    var _c = matches.groups,
      quickfixId = _c.quickfixId,
      type = _c.type,
      firstColumnType = _c.firstColumnType,
      firstColumnValue = _c.firstColumnValue,
      secondColumnType = _c.secondColumnType,
      secondColumnValue = _c.secondColumnValue,
      contents = _c.contents;
    if (!quickfixes.has(quickfixId)) {
      throw new Error(
        "Unexpected quickfix ID '"
          .concat(
            (_a = matches.groups) === null || _a === void 0 ? void 0 : _a.quickfixId,
            "' found at ",
          )
          .concat(comment.line, ':')
          .concat(comment.column),
      );
    }
    var quickfix = quickfixes.get(quickfixId);
    var line = (0, locations_1.extractEffectiveLine)(quickfix.lineIssues.line, matches);
    var edit = {
      line: line,
      type: type,
      start:
        firstColumnType === 'sc'
          ? +firstColumnValue
          : secondColumnType === 'sc'
          ? +secondColumnValue
          : undefined,
      end:
        firstColumnType === 'ec'
          ? +firstColumnValue
          : secondColumnType === 'ec'
          ? +secondColumnValue
          : undefined,
      contents: contents,
    };
    quickfix.changes.push(edit);
  }
}
exports.extractQuickFixes = extractQuickFixes;
