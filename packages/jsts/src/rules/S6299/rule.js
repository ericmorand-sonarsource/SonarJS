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
// https://sonarsource.github.io/rspec/#/rspec/S6299/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
exports.rule = {
  meta: {
    messages: {
      safeVueBypassing: 'Make sure bypassing Vue built-in sanitization is safe here.',
    },
  },
  create: function (context) {
    var _a, _b;
    var services = context.sourceCode.parserServices;
    function attrsHref(calleeName) {
      // select call expression with given name where second argument is object expression like { attrs: { href: 'bla' } }
      return "CallExpression[callee.name='".concat(
        calleeName,
        "'] ObjectExpression.arguments:nth-child(2) > Property[key.name='attrs'] > ObjectExpression.value > Property[key.name='href']",
      );
    }
    var ruleListener =
      ((_a = {}),
      (_a[
        "JSXAttribute[name.name='domPropsInnerHTML']," +
          "Property[key.name='domProps'] > ObjectExpression.value > Property[key.name='innerHTML']"
      ] = function (node) {
        context.report({ node: node, messageId: 'safeVueBypassing' });
      }),
      (_a[''.concat(attrsHref('createElement'), ',').concat(attrsHref('h'))] = function (node) {
        context.report({ node: node, messageId: 'safeVueBypassing' });
      }),
      _a);
    // @ts-ignore
    if (services.defineTemplateBodyVisitor) {
      // analyze <template> in .vue file
      var templateBodyVisitor = context.sourceCode.parserServices.defineTemplateBodyVisitor(
        ((_b = {}),
        (_b[
          "VAttribute[directive=true][key.name.name='html']," +
            "VAttribute[directive=true][key.argument.name='href']"
        ] = function (node) {
          context.report({
            loc: node.loc,
            messageId: 'safeVueBypassing',
          });
        }),
        _b),
      );
      Object.assign(ruleListener, templateBodyVisitor);
    }
    return ruleListener;
  },
};
