'use strict';
var __spreadArray =
  (this && this.__spreadArray) ||
  function (to, from, pack) {
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from));
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.FileIssues = void 0;
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
var comments_1 = require('./comments');
var locations_1 = require('./locations');
var quickfixes_1 = require('./quickfixes');
var issues_1 = require('./issues');
var FileIssues = /** @class */ (function () {
  /**
   * Parses the file into its expected errors. Throws if error flags are not well formatted.
   * @param fileContent
   * @param filePath
   */
  function FileIssues(fileContent, filePath) {
    this.expectedIssues = new Map();
    this.quickfixes = new Map();
    this.orphanSecondaryLocations = [];
    this.currentPrimary = null;
    var comments = (0, comments_1.extractComments)(fileContent, filePath);
    for (var _i = 0, comments_2 = comments; _i < comments_2.length; _i++) {
      var comment = comments_2[_i];
      if ((0, issues_1.isNonCompliantLine)(comment.value)) {
        (0, issues_1.extractLineIssues)(this, comment);
      } else if ((0, locations_1.isLocationLine)(comment.value)) {
        (0, locations_1.extractLocations)(this, comment);
      } else if ((0, quickfixes_1.isQuickfixLine)(comment.value)) {
        (0, quickfixes_1.extractQuickFixes)(this.quickfixes, comment);
      }
    }
  }
  FileIssues.prototype.getExpectedIssues = function () {
    if (this.orphanSecondaryLocations.length !== 0) {
      throw new Error(
        this.orphanSecondaryLocations
          .map(function (secondary) {
            return "Secondary location '>' without next primary location at ".concat(
              secondary.range.toString(),
            );
          })
          .join('\n\n'),
      );
    }
    return __spreadArray([], this.expectedIssues.values(), true);
  };
  FileIssues.prototype.addLocation = function (location) {
    if (location instanceof locations_1.PrimaryLocation) {
      this.addPrimary(location);
    } else {
      this.addSecondary(location);
    }
  };
  FileIssues.prototype.addPrimary = function (primary) {
    var lineIssues = this.expectedIssues.get(primary.range.line);
    if (lineIssues === undefined) {
      throw new Error(
        'Primary location does not have a related issue at '.concat(primary.range.toString()),
      );
    }
    if (lineIssues.primaryLocation !== null) {
      throw new Error(
        'Primary location conflicts with another primary location at '.concat(
          primary.range.toString(),
        ),
      );
    }
    this.orphanSecondaryLocations.forEach(function (secondary) {
      return primary.secondaryLocations.push(secondary);
    });
    this.orphanSecondaryLocations = [];
    lineIssues.primaryLocation = primary;
    this.currentPrimary = primary;
  };
  FileIssues.prototype.addSecondary = function (secondary) {
    if (secondary.primaryIsBefore) {
      if (this.currentPrimary == null) {
        throw new Error(
          "Secondary location '<' without previous primary location at ".concat(
            secondary.range.toString(),
          ),
        );
      }
      this.currentPrimary.secondaryLocations.push(secondary);
    } else {
      this.orphanSecondaryLocations.push(secondary);
    }
  };
  return FileIssues;
})();
exports.FileIssues = FileIssues;
