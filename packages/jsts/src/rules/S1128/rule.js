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
// https://sonarsource.github.io/rspec/#/rspec/S1128/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
var EXCLUDED_IMPORTS = ['React'];
var JSDOC_TAGS = [
  '@abstract',
  '@access',
  '@alias',
  '@arg',
  '@argument',
  '@async',
  '@augments',
  '@author',
  '@borrows',
  '@callback',
  '@class',
  '@classdesc',
  '@const',
  '@constant',
  '@constructor',
  '@constructs',
  '@copyright',
  '@default',
  '@defaultvalue',
  '@deprecated',
  '@desc',
  '@description',
  '@emits',
  '@enum',
  '@event',
  '@example',
  '@exception',
  '@exports',
  '@extends',
  '@external',
  '@file',
  '@fileoverview',
  '@fires',
  '@func',
  '@function',
  '@generator',
  '@global',
  '@hideconstructor',
  '@host',
  '@ignore',
  '@implements',
  '@inheritdoc',
  '@inner',
  '@instance',
  '@interface',
  '@kind',
  '@lends',
  '@license',
  '@link',
  '@linkcode',
  '@linkplain',
  '@listens',
  '@member',
  '@memberof',
  '@method',
  '@mixes',
  '@mixin',
  '@module',
  '@name',
  '@namespace',
  '@override',
  '@overview',
  '@package',
  '@param',
  '@private',
  '@prop',
  '@property',
  '@protected',
  '@public',
  '@readonly',
  '@requires',
  '@return',
  '@returns',
  '@see',
  '@since',
  '@static',
  '@summary',
  '@this',
  '@throws',
  '@todo',
  '@tutorial',
  '@type',
  '@typedef',
  '@var',
  '@variation',
  '@version',
  '@virtual',
  '@yield',
  '@yields',
];
exports.rule = {
  meta: {
    messages: {
      removeUnusedImport: "Remove this unused import of '{{symbol}}'.",
      suggestRemoveWholeStatement: 'Remove this import statement',
      suggestRemoveOneVariable: 'Remove this variable import',
    },
    hasSuggestions: true,
  },
  create: function (context) {
    var isJsxPragmaSet =
      context.sourceCode.getAllComments().findIndex(function (comment) {
        return comment.value.includes('@jsx jsx');
      }) > -1;
    var unusedImports = [];
    var tsTypeIdentifiers = new Set();
    var vueIdentifiers = new Set();
    var saveTypeIdentifier = function (node) {
      return tsTypeIdentifiers.add(node.name);
    };
    function isExcluded(variable) {
      return EXCLUDED_IMPORTS.includes(variable.name);
    }
    function isUnused(variable) {
      return variable.references.length === 0;
    }
    function isImplicitJsx(variable) {
      return variable.name === 'jsx' && isJsxPragmaSet;
    }
    var ruleListener = {
      ImportDeclaration: function (node) {
        var variables = context.getDeclaredVariables(node);
        for (var _i = 0, variables_1 = variables; _i < variables_1.length; _i++) {
          var variable = variables_1[_i];
          if (!isExcluded(variable) && !isImplicitJsx(variable) && isUnused(variable)) {
            unusedImports.push({
              id: variable.identifiers[0],
              importDecl: node,
            });
          }
        }
      },
      'TSTypeReference > Identifier, TSClassImplements > Identifier, TSInterfaceHeritage > Identifier':
        function (node) {
          saveTypeIdentifier(node);
        },
      "TSQualifiedName[left.type = 'Identifier']": function (node) {
        saveTypeIdentifier(node.left);
      },
      "TSInterfaceHeritage > MemberExpression[object.type = 'Identifier'], TSClassImplements > MemberExpression[object.type = 'Identifier']":
        function (node) {
          saveTypeIdentifier(node.object);
        },
      'Program:exit': function () {
        var jsxFactories = getJsxFactories(context);
        var jsxIdentifiers = getJsxIdentifiers(context);
        var jsDocComments = getJsDocComments(context);
        unusedImports
          .filter(function (_a) {
            var unused = _a.id;
            return (
              !jsxIdentifiers.includes(unused.name) &&
              !tsTypeIdentifiers.has(unused.name) &&
              !(
                vueIdentifiers.has(unused.name) &&
                (0, helpers_1.isInsideVueSetupScript)(unused, context)
              ) &&
              !jsxFactories.has(unused.name) &&
              !jsDocComments.some(function (comment) {
                return comment.value.includes(unused.name);
              })
            );
          })
          .forEach(function (unused) {
            return context.report({
              messageId: 'removeUnusedImport',
              data: {
                symbol: unused.id.name,
              },
              node: unused.id,
              suggest: [getSuggestion(context, unused)],
            });
          });
      },
    };
    // @ts-ignore
    if (context.sourceCode.parserServices.defineTemplateBodyVisitor) {
      return context.sourceCode.parserServices.defineTemplateBodyVisitor(
        {
          VElement: function (node) {
            var rawName = node.rawName;
            var name = rawName.split('.')[0];
            vueIdentifiers.add(toCamelCase(name));
            vueIdentifiers.add(toPascalCase(name));
          },
          VDirectiveKey: function (node) {
            var name = node.name.name;
            vueIdentifiers.add(toCamelCase(name));
            vueIdentifiers.add(toPascalCase(name));
          },
          Identifier: function (node) {
            vueIdentifiers.add(node.name);
          },
        },
        ruleListener,
        { templateBodyTriggerSelector: 'Program' },
      );
    }
    return ruleListener;
  },
};
// vue only capitalizes the char after '-'
function toCamelCase(str) {
  return str.replace(/-\w/g, function (s) {
    return s[1].toUpperCase();
  });
}
function toPascalCase(str) {
  var camelized = toCamelCase(str);
  return camelized[0].toUpperCase() + camelized.slice(1);
}
function getSuggestion(context, _a) {
  var id = _a.id,
    importDecl = _a.importDecl;
  var variables = context.getDeclaredVariables(importDecl);
  if (variables.length === 1) {
    return {
      messageId: 'suggestRemoveWholeStatement',
      fix: function (fixer) {
        return (0, helpers_1.removeNodeWithLeadingWhitespaces)(context, importDecl, fixer);
      },
    };
  }
  var specifiers = importDecl.specifiers;
  var unusedSpecifier = specifiers.find(function (specifier) {
    return specifier.local === id;
  });
  var code = context.sourceCode;
  var range;
  switch (unusedSpecifier.type) {
    case 'ImportDefaultSpecifier': {
      var tokenAfter = code.getTokenAfter(id);
      // default import is always first
      range = [id.range[0], code.getTokenAfter(tokenAfter).range[0]];
      break;
    }
    case 'ImportNamespaceSpecifier':
      // namespace import is always second
      range = [code.getTokenBefore(unusedSpecifier).range[0], unusedSpecifier.range[1]];
      break;
    case 'ImportSpecifier': {
      var simpleSpecifiers = specifiers.filter(function (specifier) {
        return specifier.type === 'ImportSpecifier';
      });
      var index = simpleSpecifiers.findIndex(function (specifier) {
        return specifier === unusedSpecifier;
      });
      if (simpleSpecifiers.length === 1) {
        range = [specifiers[0].range[1], code.getTokenAfter(unusedSpecifier).range[1]];
      } else if (index === 0) {
        range = [simpleSpecifiers[0].range[0], simpleSpecifiers[1].range[0]];
      } else {
        range = [simpleSpecifiers[index - 1].range[1], simpleSpecifiers[index].range[1]];
      }
    }
  }
  return {
    messageId: 'suggestRemoveOneVariable',
    fix: function (fixer) {
      return fixer.removeRange(range);
    },
  };
}
function getJsxFactories(context) {
  var factories = new Set();
  var parserServices = context.sourceCode.parserServices;
  if ((0, helpers_1.isRequiredParserServices)(parserServices)) {
    var compilerOptions = parserServices.program.getCompilerOptions();
    if (compilerOptions.jsxFactory) {
      factories.add(compilerOptions.jsxFactory);
    }
    if (compilerOptions.jsxFragmentFactory) {
      factories.add(compilerOptions.jsxFragmentFactory);
    }
  }
  return factories;
}
function getJsxIdentifiers(context) {
  return context.sourceCode.ast.tokens
    .filter(function (token) {
      return token.type === 'JSXIdentifier';
    })
    .map(function (token) {
      return token.value;
    });
}
function getJsDocComments(context) {
  return context.sourceCode.getAllComments().filter(function (comment) {
    return (
      comment.type === 'Block' &&
      JSDOC_TAGS.some(function (tag) {
        return comment.value.includes(tag);
      })
    );
  });
}
