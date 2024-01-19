'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.extractLineIssues = exports.isNonCompliantLine = exports.LineIssues = void 0;
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
var locations_1 = require('./locations');
var quickfixes_1 = require('./quickfixes');
var START_WITH_NON_COMPLIANT = /^ *Noncompliant/i;
var NON_COMPLIANT_PATTERN = RegExp(
  ' *Noncompliant' +
    locations_1.LINE_ADJUSTMENT +
    // issue count, ex: 2
    '(?: +(?<issueCount>\\d+))?' +
    // quickfixes, ex: [[qf1,qf2]]
    ' *(?:' +
    quickfixes_1.QUICKFIX_ID +
    ')?' +
    // messages, ex: {{msg1}} {{msg2}}
    ' *(?<messages>(\\{\\{.*?\\}\\} *)+)?',
  'i',
);
var LineIssues = /** @class */ (function () {
  function LineIssues(line, messages, quickfixes, quickFixesMap) {
    var _this = this;
    this.line = line;
    this.messages = messages;
    this.quickfixes = [];
    this.primaryLocation = null;
    if (quickfixes === null || quickfixes === void 0 ? void 0 : quickfixes.length) {
      this.quickfixes = quickfixes
        .split(RegExp(quickfixes_1.QUICKFIX_SEPARATOR))
        .map(function (quickfixAndMessage, index) {
          var _a = quickfixAndMessage.split('='),
            quickfixId = _a[0],
            messageIndexStr = _a[1];
          var messageIndex = !messageIndexStr ? index : parseInt(messageIndexStr);
          if (quickFixesMap.has(quickfixId)) {
            throw new Error('QuickFix ID '.concat(quickfixId, ' has already been declared'));
          }
          if (messageIndex >= _this.messages.length) {
            throw new Error(
              'QuickFix ID '
                .concat(quickfixId, ' refers to message index ')
                .concat(messageIndex, ' but there are only ')
                .concat(_this.messages.length, ' messages'),
            );
          }
          var _b = quickfixId.endsWith('!') ? [quickfixId.slice(0, -1), true] : [quickfixId, false],
            id = _b[0],
            mandatory = _b[1];
          var qf = new quickfixes_1.QuickFix(id, mandatory, messageIndex, _this);
          quickFixesMap.set(id, qf);
          return qf;
        });
    }
  }
  LineIssues.prototype.merge = function (other) {
    var _a;
    (_a = this.messages).push.apply(_a, other.messages);
    if (this.primaryLocation === null) {
      this.primaryLocation = other.primaryLocation;
    }
  };
  return LineIssues;
})();
exports.LineIssues = LineIssues;
function isNonCompliantLine(comment) {
  return START_WITH_NON_COMPLIANT.test(comment);
}
exports.isNonCompliantLine = isNonCompliantLine;
function extractLineIssues(file, comment) {
  var _a, _b, _c;
  var matcher = NON_COMPLIANT_PATTERN.exec(comment.value);
  if (matcher === null) {
    throw new Error(
      'Invalid comment format at line '.concat(comment.line, ': ').concat(comment.value),
    );
  }
  var effectiveLine = (0, locations_1.extractEffectiveLine)(comment.line, matcher);
  var messages = extractIssueCountOrMessages(
    comment.line,
    (_a = matcher.groups) === null || _a === void 0 ? void 0 : _a.issueCount,
    (_b = matcher.groups) === null || _b === void 0 ? void 0 : _b.messages,
  );
  var lineIssues = new LineIssues(
    effectiveLine,
    messages,
    (_c = matcher.groups) === null || _c === void 0 ? void 0 : _c.quickfixes,
    file.quickfixes,
  );
  var existingLineIssues = file.expectedIssues.get(lineIssues.line);
  if (existingLineIssues) {
    existingLineIssues.merge(lineIssues);
  } else {
    file.expectedIssues.set(lineIssues.line, lineIssues);
  }
}
exports.extractLineIssues = extractLineIssues;
function extractIssueCountOrMessages(line, issueCountGroup, messageGroup) {
  if (messageGroup) {
    if (issueCountGroup) {
      throw new Error(
        'Error, you can not specify issue count and messages at line '.concat(
          line,
          ', you have to choose either:',
        ) +
          '\n  Noncompliant '
            .concat(issueCountGroup, '\nor\n  Noncompliant ')
            .concat(messageGroup, '\n'),
      );
    }
    var messageContent = messageGroup.trim();
    return messageContent
      .substring('{{'.length, messageContent.length - '}}'.length)
      .split(/\}\} *\{\{/);
  }
  var issueCount = issueCountGroup ? parseInt(issueCountGroup) : 1;
  return new Array(issueCount);
}
