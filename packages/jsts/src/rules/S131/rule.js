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
// https://sonarsource.github.io/rspec/#/rspec/S131/javascript
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
var _a, _b;
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var typescript_eslint_1 = require('../typescript-eslint');
var helpers_1 = require('../helpers');
/**
 * This rule raises issues on switch statements without a default branch if, and only if,
 * the discriminant of the switch statement is not of union type. This exception is due to
 * `switch-exhaustiveness-check` decorated below which checks the exhaustiveness of switch
 * statements on TypeScript unions and enums. Therefore, we avoid here raising multiple issues if the
 * discriminant of the switch statement denotes a union or enum, provided that type information is available.
 */
var switchWithoutDefaultRule = {
  meta: {
    messages: {
      switchDefault: 'Add a "default" clause to this "switch" statement.',
      addDefault: 'Add a "default" branch.',
    },
  },
  create: function (context) {
    var services = context.sourceCode.parserServices;
    var hasTypeInformation = (0, helpers_1.isRequiredParserServices)(services);
    return {
      SwitchStatement: function (node) {
        var discriminant = node.discriminant,
          cases = node.cases;
        if (hasTypeInformation && (0, helpers_1.isUnion)(discriminant, services)) {
          return;
        }
        var defaultClause = cases.find(function (c) {
          return c.test === null;
        });
        if (!defaultClause) {
          var switchKeyword = getSwitchKeyword(node, context);
          context.report({
            messageId: 'switchDefault',
            loc: switchKeyword.loc,
            suggest: [
              {
                messageId: 'addDefault',
                fix: function (fixer) {
                  return fixSwitch(fixer, node, context.sourceCode);
                },
              },
            ],
          });
        }
      },
    };
  },
};
/**
 * The rule `switch-exhaustiveness-check` is a TypeScript ESLint rule that uses type information.
 * Therefore, we need to sanitize the rule in case TypeScript's type checker is missing when the
 * rule is executed to prevent runtime errors. Furthermore, we need to decorate the rule so that
 * it raises issues at the same location, that is, the `switch` keyword.
 */
var switchExhaustivenessRule = typescript_eslint_1.tsEslintRules['switch-exhaustiveness-check'];
var decoratedSwitchExhaustivenessRule = (0, helpers_1.interceptReport)(
  switchExhaustivenessRule,
  function (context, descriptor) {
    var switchNode = descriptor.node.parent;
    var switchKeyword = getSwitchKeyword(switchNode, context);
    context.report(__assign(__assign({}, descriptor), { loc: switchKeyword.loc }));
  },
);
function getSwitchKeyword(node, context) {
  return context.sourceCode.getFirstToken(node, function (token) {
    return token.type === 'Keyword' && token.value === 'switch';
  });
}
function fixSwitch(fixer, node, sourceCode) {
  /** Either suggest a default branch after the last case while preserving contextual indentation */
  var _a, _b;
  var lastCase = node.cases.length > 0 ? node.cases[node.cases.length - 1] : null;
  var caseIndent = lastCase
    ? ' '.repeat((_a = lastCase.loc) === null || _a === void 0 ? void 0 : _a.start.column)
    : ' '.repeat((_b = node.loc) === null || _b === void 0 ? void 0 : _b.start.column);
  var code = "default: { throw new Error('Not implemented yet'); }";
  var fixString = ''.concat(caseIndent).concat(code);
  if (lastCase) {
    return fixer.insertTextAfter(lastCase, '\n'.concat(fixString));
  }
  /* Or suggest a default branch with the same indentation level as the switch starting line */
  var openingBrace = sourceCode.getTokenAfter(node.discriminant, function (token) {
    return token.type === 'Punctuator' && token.value === '{';
  });
  var closingBrace = sourceCode.getTokenAfter(node.discriminant, function (token) {
    return token.type === 'Punctuator' && token.value === '}';
  });
  return fixer.replaceTextRange(
    [openingBrace.range[0], closingBrace.range[1]],
    ['{', fixString, ''.concat(caseIndent, '}')].join('\n'),
  );
}
exports.rule = {
  meta: {
    hasSuggestions: true,
    messages: __assign(
      __assign(
        {},
        (_a = switchWithoutDefaultRule.meta) === null || _a === void 0 ? void 0 : _a.messages,
      ),
      (_b = decoratedSwitchExhaustivenessRule.meta) === null || _b === void 0
        ? void 0
        : _b.messages,
    ),
  },
  create: function (context) {
    return (0, helpers_1.mergeRules)(
      switchWithoutDefaultRule.create(context),
      decoratedSwitchExhaustivenessRule.create(context),
    );
  },
};
