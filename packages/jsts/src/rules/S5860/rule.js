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
// https://sonarsource.github.io/rspec/#/rspec/S5860/javascript
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod)
        if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var regexpp = __importStar(require('@eslint-community/regexpp'));
var helpers_1 = require('../helpers');
var regex_1 = require('../helpers/regex');
var parameters_1 = require('../../linter/parameters');
exports.rule = {
  meta: {
    schema: [
      {
        // internal parameter for rules having secondary locations
        enum: [parameters_1.SONAR_RUNTIME],
      },
    ],
  },
  create: function (context) {
    var services = context.sourceCode.parserServices;
    if (!(0, helpers_1.isRequiredParserServices)(services)) {
      return {};
    }
    var intellisense = new RegexIntelliSense(services, context);
    return {
      'Literal[regex]:exit': function (literal) {
        /* /regex/ */
        intellisense.collectKnowledge(literal);
      },
      'NewExpression:exit': function (newExpr) {
        /* new RegExp(regex) */
        intellisense.collectKnowledge(newExpr);
      },
      'CallExpression:exit': function (callExpr) {
        /* RegExp(regex), implicit regex e.g. str.match('regex') */
        intellisense.collectKnowledge(callExpr);
        /* str.match(pattern) / pattern.exec(str) */
        intellisense.collectPatternMatcher(callExpr);
        /* str.replace(pattern, substr) */
        checkStringReplaceGroupReferences(callExpr, intellisense);
      },
      'MemberExpression:exit': function (memberExpr) {
        if (memberExpr.computed) {
          /* matcher[index] */
          checkIndexBasedGroupReference(memberExpr, intellisense);
        } else {
          /* matcher.groups.<name> / matcher.indices.groups.<name> */
          checkNonExistingGroupReference(memberExpr, intellisense);
        }
      },
      'Program:exit': function () {
        checkUnusedGroups(intellisense);
        checkIndexedGroups(intellisense);
      },
    };
  },
};
function checkStringReplaceGroupReferences(callExpr, intellisense) {
  if ((0, regex_1.isStringReplaceCall)(callExpr, intellisense.services)) {
    var _a = callExpr.arguments,
      pattern = _a[0],
      substr = _a[1];
    var regex = intellisense.findRegex(pattern);
    if (regex) {
      var references = (0, regex_1.extractReferences)(substr);
      var indexes_1 = new Set();
      var names_1 = new Set();
      references.forEach(function (ref) {
        return isNaN(Number(ref.value)) ? names_1.add(ref.value) : indexes_1.add(Number(ref.value));
      });
      regex.groups.forEach(function (group) {
        group.used || (group.used = names_1.has(group.name));
        group.used || (group.used = indexes_1.has(group.index));
      });
      var indexedGroups = regex.groups.filter(function (group) {
        return indexes_1.has(group.index);
      });
      if (indexedGroups.length > 0) {
        var _b = prepareSecondaries(regex, indexedGroups, intellisense, 'Group'),
          locations = _b.locations,
          messages = _b.messages;
        intellisense.context.report({
          message: (0, helpers_1.toEncodedMessage)(
            'Directly use the group names instead of their numbers.',
            locations,
            messages,
          ),
          node: substr,
        });
      }
    }
  }
}
function checkIndexBasedGroupReference(memberExpr, intellisense) {
  var matcher = memberExpr.object,
    property = memberExpr.property;
  var regex = intellisense.resolve(matcher);
  if (regex) {
    var maybeIndex = (0, helpers_1.getValueOfExpression)(intellisense.context, property, 'Literal');
    if (maybeIndex && typeof maybeIndex.value === 'number') {
      var index_1 = maybeIndex.value;
      var group = regex.groups.find(function (grp) {
        return grp.index === index_1;
      });
      if (group) {
        group.used = true;
        var _a = prepareSecondaries(regex, [group], intellisense, 'Group'),
          locations = _a.locations,
          messages = _a.messages;
        intellisense.context.report({
          message: (0, helpers_1.toEncodedMessage)(
            "Directly use '".concat(group.name, "' instead of its group number."),
            locations,
            messages,
          ),
          node: property,
        });
      }
    }
  }
}
function checkNonExistingGroupReference(memberExpr, intellisense) {
  var matcher = memberExpr.object;
  var regex = intellisense.resolve(matcher);
  if (regex) {
    /* matcher.groups.<name> / matcher.indices.groups.<name>  */
    var groupNodes = extractGroupNodes(memberExpr, intellisense);
    var _loop_1 = function (groupNode) {
      var groupName = groupNode.type === 'Identifier' ? groupNode.name : groupNode.value;
      var group = regex.groups.find(function (grp) {
        return grp.name === groupName;
      });
      if (group) {
        group.used = true;
      } else {
        var _a = prepareSecondaries(regex, regex.groups, intellisense, 'Named group'),
          locations = _a.locations,
          messages = _a.messages;
        intellisense.context.report({
          message: (0, helpers_1.toEncodedMessage)(
            "There is no group named '".concat(groupName, "' in the regular expression."),
            locations,
            messages,
          ),
          node: groupNode,
        });
      }
    };
    for (var _i = 0, groupNodes_1 = groupNodes; _i < groupNodes_1.length; _i++) {
      var groupNode = groupNodes_1[_i];
      _loop_1(groupNode);
    }
  }
}
function extractGroupNodes(memberExpr, intellisense) {
  if ((0, helpers_1.isDotNotation)(memberExpr)) {
    var property = memberExpr.property;
    var ancestors = intellisense.context.getAncestors();
    var parent_1 = ancestors.pop();
    while (parent_1.type === 'TSNonNullExpression') {
      parent_1 = ancestors.pop();
    }
    if (parent_1) {
      switch (property.name) {
        case 'groups':
          /* matcher.groups.<name> or matcher.groups['name'] */
          return extractNamedOrDestructuredGroupNodes(parent_1);
        case 'indices':
          /* matcher.indices.groups.<name> or matcher.indices.groups['name'] */
          if ((0, helpers_1.isDotNotation)(parent_1) && parent_1.property.name === 'groups') {
            parent_1 = ancestors.pop();
            if (parent_1) {
              return extractNamedOrDestructuredGroupNodes(parent_1);
            }
          }
      }
    }
  }
  return [];
}
function extractNamedOrDestructuredGroupNodes(node) {
  if ((0, helpers_1.isDotNotation)(node) || (0, helpers_1.isIndexNotation)(node)) {
    /* matcher.groups.<name> or matcher.groups['name'] */
    return [node.property];
  } else if ((0, helpers_1.isObjectDestructuring)(node)) {
    /* { <name1>,..<nameN> } = matcher.groups */
    var destructuredGroups = [];
    var pattern = node.type === 'VariableDeclarator' ? node.id : node.left;
    for (var _i = 0, _a = pattern.properties; _i < _a.length; _i++) {
      var property = _a[_i];
      if (property.type === 'Property' && property.key.type === 'Identifier') {
        destructuredGroups.push(property.key);
      }
    }
    return destructuredGroups;
  } else {
    return [];
  }
}
function checkUnusedGroups(intellisense) {
  intellisense.getKnowledge().forEach(function (regex) {
    if (regex.matched) {
      var unusedGroups = regex.groups.filter(function (group) {
        return !group.used;
      });
      if (unusedGroups.length) {
        var _a = prepareSecondaries(regex, unusedGroups, intellisense, 'Named group'),
          locations = _a.locations,
          messages = _a.messages;
        intellisense.context.report({
          message: (0, helpers_1.toEncodedMessage)(
            'Use the named groups of this regex or remove the names.',
            locations,
            messages,
          ),
          node: regex.node,
        });
      }
    }
  });
}
function prepareSecondaries(regex, groups, intellisense, label) {
  var locations = [];
  var messages = [];
  for (var _i = 0, groups_1 = groups; _i < groups_1.length; _i++) {
    var grp = groups_1[_i];
    var loc = (0, regex_1.getRegexpLocation)(regex.node, grp.node, intellisense.context);
    if (loc) {
      locations.push({ loc: loc });
      messages.push(''.concat(label, " '").concat(grp.name, "'"));
    }
  }
  return { locations: locations, messages: messages };
}
function checkIndexedGroups(intellisense) {
  intellisense.getKnowledge().forEach(function (regex) {
    regex.groups.forEach(function (group) {
      var _a = prepareSecondaries(regex, [group], intellisense, 'Group'),
        locations = _a.locations,
        messages = _a.messages;
      group.node.references.forEach(function (reference) {
        var loc = (0, regex_1.getRegexpLocation)(regex.node, reference, intellisense.context);
        if (loc && typeof reference.ref === 'number') {
          intellisense.context.report({
            message: (0, helpers_1.toEncodedMessage)(
              "Directly use '".concat(group.name, "' instead of its group number."),
              locations,
              messages,
            ),
            loc: loc,
          });
        }
      });
    });
  });
}
function makeRegexKnowledge(node, regexp) {
  var capturingGroups = [];
  var backreferences = [];
  regexpp.visitRegExpAST(regexp, {
    onBackreferenceEnter: function (reference) {
      return reference.resolved.name && backreferences.push(reference);
    },
    onCapturingGroupEnter: function (group) {
      return capturingGroups.push(group);
    },
  });
  var groups = [];
  capturingGroups.forEach(function (group, index) {
    return group.name && groups.push(makeGroupKnowledge(group, backreferences, index + 1));
  });
  return { node: node, regexp: regexp, groups: groups, matched: false };
}
function makeGroupKnowledge(node, backreferences, index) {
  var name = node.name;
  var used = backreferences.some(function (backreference) {
    return backreference.resolved === node;
  });
  return { node: node, name: name, used: used, index: index };
}
var RegexIntelliSense = /** @class */ (function () {
  function RegexIntelliSense(services, context) {
    this.services = services;
    this.context = context;
    this.knowledge = [];
    this.bindings = new Map();
  }
  RegexIntelliSense.prototype.getKnowledge = function () {
    return this.knowledge;
  };
  RegexIntelliSense.prototype.collectKnowledge = function (node) {
    var regexNode = node;
    if (
      node.type === 'CallExpression' &&
      (0, regex_1.isStringRegexMethodCall)(node, this.services)
    ) {
      /* implicit regex */
      regexNode = node.arguments[0];
    }
    var regex = (0, regex_1.getParsedRegex)(regexNode, this.context);
    if (regex !== null) {
      this.knowledge.push(makeRegexKnowledge(regexNode, regex));
    }
  };
  RegexIntelliSense.prototype.collectPatternMatcher = function (callExpr) {
    var callee = callExpr.callee,
      args = callExpr.arguments;
    if ((0, helpers_1.isMethodCall)(callExpr) && args.length > 0) {
      var target = callee.object;
      var matcher = (0, helpers_1.getLhsVariable)(this.context);
      if (matcher) {
        var method = callee.property;
        if (
          (0, helpers_1.isString)(target, this.services) &&
          ['match', 'matchAll'].includes(method.name)
        ) {
          /* str.match(pattern) */
          var pattern = args[0];
          this.bind(pattern, matcher);
        } else if (method.name === 'exec' && (0, helpers_1.isString)(args[0], this.services)) {
          /* pattern.exec(str) */
          var pattern = target;
          this.bind(pattern, matcher);
        }
      }
    }
  };
  RegexIntelliSense.prototype.resolve = function (matcher) {
    var _a;
    var variable = this.findVariable(matcher);
    if (variable) {
      return (_a = this.bindings.get(variable)) !== null && _a !== void 0 ? _a : null;
    } else {
      return null;
    }
  };
  RegexIntelliSense.prototype.findRegex = function (node) {
    return this.findRegexRec(node, new Set());
  };
  RegexIntelliSense.prototype.findRegexRec = function (node, visited) {
    if (!visited.has(node)) {
      visited.add(node);
      var variable = this.findVariable(node);
      if (variable) {
        var value = (0, helpers_1.getUniqueWriteUsage)(this.context, variable.name);
        if (value) {
          var regex = this.findRegexRec(value, visited);
          if (regex) {
            return regex;
          }
        }
      }
    }
    return this.knowledge.find(function (regex) {
      return regex.node === node;
    });
  };
  RegexIntelliSense.prototype.bind = function (pattern, matcher) {
    var regex = this.findRegex(pattern);
    if (regex) {
      regex.matched = true;
      this.bindings.set(matcher, regex);
    }
  };
  RegexIntelliSense.prototype.findVariable = function (node) {
    if (node.type === 'Identifier') {
      return (0, helpers_1.getVariableFromName)(this.context, node.name);
    }
    return null;
  };
  return RegexIntelliSense;
})();
