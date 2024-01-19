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
// https://sonarsource.github.io/rspec/#/rspec/S3514/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
var parameters_1 = require('../../linter/parameters');
var MAX_INDEX = 4;
var isAllowedIndex = function (idx) {
  return idx >= 0 && idx <= MAX_INDEX;
};
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
    function visitStatements(statements) {
      var declarationsByObject = new Map();
      for (var _i = 0, statements_1 = statements; _i < statements_1.length; _i++) {
        var statement = statements_1[_i];
        if (statement.type === 'VariableDeclaration') {
          visitDeclarations(declarationsByObject, statement.declarations);
        } else {
          checkDeclarationsBlock(declarationsByObject);
          declarationsByObject.clear();
        }
      }
      checkDeclarationsBlock(declarationsByObject);
    }
    function visitDeclarations(declarationsByObject, declarations) {
      for (var _i = 0, declarations_1 = declarations; _i < declarations_1.length; _i++) {
        var declaration = declarations_1[_i];
        var id = declaration.id;
        if (declaration.init && id.type === 'Identifier') {
          var varName = id.name;
          var expression = declaration.init;
          if (expression.type !== 'MemberExpression') {
            continue;
          }
          var property = expression.property;
          if (
            (0, helpers_1.isIdentifier)(property, varName) ||
            ((0, helpers_1.isNumberLiteral)(property) && isAllowedIndex(property.value))
          ) {
            addDeclaration(declarationsByObject, expression.object, declaration);
          }
        }
      }
    }
    function addDeclaration(declarationsByObject, object, declaration) {
      var key = context.sourceCode.getText(object);
      var value = declarationsByObject.get(key);
      if (value) {
        value.push(declaration);
      } else {
        declarationsByObject.set(key, [declaration]);
      }
    }
    function checkDeclarationsBlock(declarationsByObject) {
      declarationsByObject.forEach(function (declarations, key) {
        if (declarations.length > 1) {
          var firstKind_1 = getKind(declarations[0]);
          var tail = declarations.slice(1);
          if (
            tail.every(function (decl) {
              return getKind(decl) === firstKind_1;
            })
          ) {
            context.report({
              node: declarations[0],
              message: (0, helpers_1.toEncodedMessage)(
                'Use destructuring syntax for these assignments from "'.concat(key, '".'),
                tail,
                Array(tail.length).fill('Replace this assignment.'),
              ),
            });
          }
        }
      });
    }
    return {
      BlockStatement: function (node) {
        visitStatements(node.body);
      },
      SwitchCase: function (node) {
        visitStatements(node.consequent);
      },
      Program: function (node) {
        visitStatements(node.body);
      },
    };
  },
};
function getKind(declarator) {
  var declaration = (0, helpers_1.findFirstMatchingAncestor)(declarator, function (n) {
    return n.type === 'VariableDeclaration';
  });
  return declaration === null || declaration === void 0 ? void 0 : declaration.kind;
}
