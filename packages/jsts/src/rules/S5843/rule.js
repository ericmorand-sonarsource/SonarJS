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
// https://sonarsource.github.io/rspec/#/rspec/S5843/javascript
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
var DEFAULT_THESHOLD = 20;
exports.rule = {
  meta: {
    schema: [
      { type: 'integer' },
      {
        // internal parameter for rules having secondary locations
        enum: [parameters_1.SONAR_RUNTIME],
      },
    ],
  },
  create: function (context) {
    var threshold = context.options.length > 0 ? context.options[0] : DEFAULT_THESHOLD;
    var services = context.sourceCode.parserServices;
    var regexNodes = [];
    return {
      'Literal[regex]:exit': function (node) {
        regexNodes.push(node);
      },
      'NewExpression:exit': function (node) {
        if ((0, regex_1.isRegExpConstructor)(node)) {
          regexNodes.push(node);
        }
      },
      'CallExpression:exit': function (node) {
        var callExpr = node;
        if (
          (0, helpers_1.isRequiredParserServices)(services) &&
          (0, regex_1.isStringRegexMethodCall)(callExpr, services)
        ) {
          regexNodes.push(callExpr.arguments[0]);
        } else if ((0, regex_1.isRegExpConstructor)(callExpr)) {
          regexNodes.push(callExpr);
        }
      },
      'Program:exit': function () {
        regexNodes.forEach(function (regexNode) {
          return checkRegexComplexity(regexNode, threshold, context);
        });
      },
    };
  },
};
function checkRegexComplexity(regexNode, threshold, context) {
  var _loop_1 = function (regexParts) {
    var complexity = 0;
    var secondaryLocations = [];
    var secondaryMessages = [];
    for (var _b = 0, regexParts_1 = regexParts; _b < regexParts_1.length; _b++) {
      var regexPart = regexParts_1[_b];
      var calculator = new ComplexityCalculator(regexPart, context);
      calculator.visit();
      calculator.components.forEach(function (component) {
        secondaryLocations.push(component.location);
        secondaryMessages.push(component.message);
      });
      complexity += calculator.complexity;
    }
    if (complexity > threshold) {
      context.report({
        message: (0, helpers_1.toEncodedMessage)(
          'Simplify this regular expression to reduce its complexity from '
            .concat(complexity, ' to the ')
            .concat(threshold, ' allowed.'),
          secondaryLocations,
          secondaryMessages,
          complexity - threshold,
        ),
        node: regexParts[0],
      });
    }
  };
  for (var _i = 0, _a = findRegexParts(regexNode, context); _i < _a.length; _i++) {
    var regexParts = _a[_i];
    _loop_1(regexParts);
  }
}
function findRegexParts(node, context) {
  var finder = new RegexPartFinder(context);
  finder.find(node);
  return finder.parts;
}
var RegexPartFinder = /** @class */ (function () {
  function RegexPartFinder(context) {
    this.context = context;
    this.parts = [];
  }
  RegexPartFinder.prototype.find = function (node) {
    if ((0, regex_1.isRegExpConstructor)(node)) {
      this.find(node.arguments[0]);
    } else if ((0, helpers_1.isRegexLiteral)(node)) {
      this.parts.push([node]);
    } else if ((0, helpers_1.isStringLiteral)(node)) {
      this.parts.push([node]);
    } else if ((0, helpers_1.isStaticTemplateLiteral)(node)) {
      this.parts.push([node]);
    } else if ((0, helpers_1.isIdentifier)(node)) {
      var initializer = (0, helpers_1.getUniqueWriteUsage)(this.context, node.name);
      if (initializer) {
        this.find(initializer);
      }
    } else if ((0, helpers_1.isBinaryPlus)(node)) {
      var literals = [];
      this.findInStringConcatenation(node.left, literals);
      this.findInStringConcatenation(node.right, literals);
      if (literals.length > 0) {
        this.parts.push(literals);
      }
    }
  };
  RegexPartFinder.prototype.findInStringConcatenation = function (node, literals) {
    if ((0, helpers_1.isStringLiteral)(node)) {
      literals.push(node);
    } else if ((0, helpers_1.isBinaryPlus)(node)) {
      this.findInStringConcatenation(node.left, literals);
      this.findInStringConcatenation(node.right, literals);
    } else {
      this.find(node);
    }
  };
  return RegexPartFinder;
})();
var ComplexityCalculator = /** @class */ (function () {
  function ComplexityCalculator(regexPart, context) {
    this.regexPart = regexPart;
    this.context = context;
    this.nesting = 1;
    this.complexity = 0;
    this.components = [];
    this.regexPartAST = (0, regex_1.getParsedRegex)(regexPart, context);
  }
  ComplexityCalculator.prototype.visit = function () {
    var _this = this;
    if (!this.regexPartAST) {
      return;
    }
    regexpp.visitRegExpAST(this.regexPartAST, {
      onAssertionEnter: function (node) {
        /* lookaround */
        if (node.kind === 'lookahead' || node.kind === 'lookbehind') {
          var _a = (0, regex_1.getRegexpRange)(_this.regexPart, node),
            start = _a[0],
            end = _a[1];
          _this.increaseComplexity(_this.nesting, node, [
            0,
            -(end - start - 1) + (node.kind === 'lookahead' ? '?='.length : '?<='.length),
          ]);
          _this.nesting++;
          _this.onDisjunctionEnter(node);
        }
      },
      onAssertionLeave: function (node) {
        /* lookaround */
        if (node.kind === 'lookahead' || node.kind === 'lookbehind') {
          _this.onDisjunctionLeave(node);
          _this.nesting--;
        }
      },
      onBackreferenceEnter: function (node) {
        _this.increaseComplexity(1, node);
      },
      onCapturingGroupEnter: function (node) {
        /* disjunction */
        _this.onDisjunctionEnter(node);
      },
      onCapturingGroupLeave: function (node) {
        /* disjunction */
        _this.onDisjunctionLeave(node);
      },
      onCharacterClassEnter: function (node) {
        /* character class */
        var _a = (0, regex_1.getRegexpRange)(_this.regexPart, node),
          start = _a[0],
          end = _a[1];
        _this.increaseComplexity(1, node, [0, -(end - start - 1)]);
        _this.nesting++;
      },
      onCharacterClassLeave: function (_node) {
        /* character class */
        _this.nesting--;
      },
      onGroupEnter: function (node) {
        /* disjunction */
        _this.onDisjunctionEnter(node);
      },
      onGroupLeave: function (node) {
        /* disjunction */
        _this.onDisjunctionLeave(node);
      },
      onPatternEnter: function (node) {
        /* disjunction */
        _this.onDisjunctionEnter(node);
      },
      onPatternLeave: function (node) {
        /* disjunction */
        _this.onDisjunctionLeave(node);
      },
      onQuantifierEnter: function (node) {
        /* repetition */
        var start = (0, regex_1.getRegexpRange)(_this.regexPart, node)[0];
        var _a = (0, regex_1.getRegexpRange)(_this.regexPart, node.element),
          end = _a[1];
        _this.increaseComplexity(_this.nesting, node, [end - start, 0]);
        _this.nesting++;
      },
      onQuantifierLeave: function (_node) {
        /* repetition */
        _this.nesting--;
      },
    });
  };
  ComplexityCalculator.prototype.increaseComplexity = function (increment, node, offset) {
    this.complexity += increment;
    var message = '+' + increment;
    if (increment > 1) {
      message += ' (incl '.concat(increment - 1, ' for nesting)');
    }
    var loc = (0, regex_1.getRegexpLocation)(this.regexPart, node, this.context, offset);
    if (loc) {
      this.components.push({
        location: {
          loc: loc,
        },
        message: message,
      });
    }
  };
  ComplexityCalculator.prototype.onDisjunctionEnter = function (node) {
    if (node.alternatives.length > 1) {
      var alternatives = node.alternatives;
      var increment = this.nesting;
      while (alternatives.length > 1) {
        var _a = (0, regex_1.getRegexpRange)(this.regexPart, alternatives[1]),
          start = _a[0],
          end = _a[1];
        this.increaseComplexity(increment, alternatives[1], [-1, -(end - start)]);
        increment = 1;
        alternatives = alternatives.slice(1);
      }
      this.nesting++;
    }
  };
  ComplexityCalculator.prototype.onDisjunctionLeave = function (node) {
    if (node.alternatives.length > 1) {
      this.nesting--;
    }
  };
  return ComplexityCalculator;
})();
