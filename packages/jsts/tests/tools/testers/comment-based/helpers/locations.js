'use strict';
var __extends =
  (this && this.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== 'function' && b !== null)
        throw new TypeError('Class extends value ' + String(b) + ' is not a constructor or null');
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
    };
  })();
Object.defineProperty(exports, '__esModule', { value: true });
exports.extractEffectiveLine =
  exports.extractLocations =
  exports.isLocationLine =
  exports.SecondaryLocation =
  exports.PrimaryLocation =
  exports.Location =
  exports.LINE_ADJUSTMENT =
    void 0;
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
var ranges_1 = require('./ranges');
exports.LINE_ADJUSTMENT = '(?:@(?<lineAdjustment>(?<relativeAdjustment>[+-])?\\d+))?';
var STARTS_WITH_LOCATION = /^ *\^/;
var COUNT = '(?<count>\\d+)';
var DIRECTION = '(?<direction>[<>])';
var MESSAGE = '(?<message>.*?)';
var LOCATION_PATTERN = RegExp(
  ' *' +
    // highlighted range, ex: ^^^^ |OR| ^^^@12 |OR| ^^^@-2
    '(?<range>\\^(?:\\[(?<params>[^\\]]+)\\]|\\^+)?)' +
    exports.LINE_ADJUSTMENT +
    // count, ex: 3 |OR| direction
    ' *(?:' +
    COUNT +
    '|' +
    DIRECTION +
    ')?' +
    // message, ex: {{msg}}
    ' *(?:\\{\\{' +
    MESSAGE +
    '\\}\\})? *' +
    '(?:\r(\n?)|\n)?',
);
var Location = /** @class */ (function () {
  function Location(range) {
    this.range = range;
  }
  return Location;
})();
exports.Location = Location;
var PrimaryLocation = /** @class */ (function (_super) {
  __extends(PrimaryLocation, _super);
  function PrimaryLocation() {
    var _this = (_super !== null && _super.apply(this, arguments)) || this;
    _this.secondaryLocations = [];
    return _this;
  }
  return PrimaryLocation;
})(Location);
exports.PrimaryLocation = PrimaryLocation;
var SecondaryLocation = /** @class */ (function (_super) {
  __extends(SecondaryLocation, _super);
  function SecondaryLocation(range, message, primaryIsBefore) {
    // we need to extract 1 from columns as it's computed by us being sonar-friendly, while primary location is eslint-friendly
    var _this =
      _super.call(
        this,
        new ranges_1.Range(range.line, range.column - 1, range.endLine, range.endColumn - 1),
      ) || this;
    _this.primaryIsBefore = primaryIsBefore;
    _this.message = message;
    return _this;
  }
  return SecondaryLocation;
})(Location);
exports.SecondaryLocation = SecondaryLocation;
function isLocationLine(comment) {
  return STARTS_WITH_LOCATION.test(comment);
}
exports.isLocationLine = isLocationLine;
function extractLocations(file, comment) {
  var line = comment.line,
    column = comment.column,
    commentContent = comment.value;
  var locations = [];
  var toBeMatched = commentContent;
  var offset = 0;
  var matcher;
  LOCATION_PATTERN.lastIndex = 0;
  while ((matcher = LOCATION_PATTERN.exec(toBeMatched)) !== null) {
    locations.push(
      matcherToLocation(line, column, commentContent.indexOf(matcher[1], offset) + 1, matcher),
    );
    toBeMatched = toBeMatched.substring(matcher[0].length);
    offset += matcher[0].length;
  }
  if (offset !== commentContent.length) {
    throw new Error(
      "Unexpected character '"
        .concat(commentContent[offset], "' found at ")
        .concat(line, ':')
        .concat(column + offset),
    );
  }
  if (locations.length) {
    for (var _i = 0, locations_1 = locations; _i < locations_1.length; _i++) {
      var location_1 = locations_1[_i];
      file.addLocation(location_1);
    }
  }
}
exports.extractLocations = extractLocations;
function matcherToLocation(line, column, offset, matcher) {
  var _a, _b;
  var effectiveLine = extractEffectiveLine(line - 1, matcher);
  var range = fileRange(effectiveLine, column, offset, matcher);
  var direction = (_a = matcher.groups) === null || _a === void 0 ? void 0 : _a.direction;
  if (!direction) {
    return new PrimaryLocation(range);
  } else {
    return new SecondaryLocation(
      range,
      (_b = matcher.groups) === null || _b === void 0 ? void 0 : _b.message,
      direction === '<',
    );
  }
}
function extractEffectiveLine(line, matcher) {
  var _a, _b;
  var lineAdjustmentGroup =
    (_a = matcher.groups) === null || _a === void 0 ? void 0 : _a.lineAdjustment;
  var relativeAdjustmentGroup =
    (_b = matcher.groups) === null || _b === void 0 ? void 0 : _b.relativeAdjustment;
  var referenceLine = relativeAdjustmentGroup ? line : 0;
  return lineAdjustmentGroup ? referenceLine + parseInt(lineAdjustmentGroup) : line;
}
exports.extractEffectiveLine = extractEffectiveLine;
function fileRange(line, column, offset, matcher) {
  var rangeLine = line;
  var rangeColumn = column + offset;
  var rangeEndLine = line;
  var rangeEndColumn = rangeColumn + matcher[1].length;
  return new ranges_1.Range(rangeLine, rangeColumn, rangeEndLine, rangeEndColumn);
}
