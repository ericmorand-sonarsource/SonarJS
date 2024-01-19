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
// https://sonarsource.github.io/rspec/#/rspec/S2681/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var NestingStatementLike = [
  'IfStatement',
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
  'WhileStatement',
];
exports.rule = {
  create: function (context) {
    return {
      Program: function (node) {
        return checkStatements(node.body, context);
      },
      BlockStatement: function (node) {
        return checkStatements(node.body, context);
      },
      TSModuleBlock: function (node) {
        return checkStatements(node.body, context);
      },
    };
  },
};
function checkStatements(statements, context) {
  chain(statements)
    .filter(function (chainedStatements) {
      return chainedStatements.areUnenclosed();
    })
    .forEach(function (unenclosedConsecutives) {
      if (unenclosedConsecutives.areAdjacent()) {
        raiseAdjacenceIssue(unenclosedConsecutives, context);
      } else if (unenclosedConsecutives.areBothIndented()) {
        raiseBlockIssue(
          unenclosedConsecutives,
          countStatementsInTheSamePile(unenclosedConsecutives.prev, statements),
          context,
        );
      } else if (unenclosedConsecutives.areInlinedAndIndented()) {
        raiseInlineAndIndentedIssue(unenclosedConsecutives, context);
      }
    });
}
function chain(statements) {
  return statements
    .reduce(function (result, statement, i, array) {
      if (i < array.length - 1 && isNestingStatement(statement)) {
        result.push({ prev: statement, next: array[i + 1] });
      }
      return result;
    }, new Array())
    .map(function (pair) {
      return new ChainedStatements(pair.prev, extractLastBody(pair.prev), pair.next);
    });
}
function extractLastBody(statement) {
  if (statement.type === 'IfStatement') {
    if (statement.alternate) {
      return statement.alternate;
    } else {
      return statement.consequent;
    }
  } else {
    return statement.body;
  }
}
function countStatementsInTheSamePile(reference, statements) {
  var startOfPile = position(reference).start;
  var lastLineOfPile = startOfPile.line;
  for (var _i = 0, statements_1 = statements; _i < statements_1.length; _i++) {
    var statement = statements_1[_i];
    var currentPosition = position(statement);
    var currentLine = currentPosition.end.line;
    var currentIndentation = currentPosition.start.column;
    if (currentLine > startOfPile.line) {
      if (currentIndentation === startOfPile.column) {
        lastLineOfPile = currentPosition.end.line;
      } else {
        break;
      }
    }
  }
  return lastLineOfPile - startOfPile.line + 1;
}
function raiseAdjacenceIssue(adjacentStatements, context) {
  context.report({
    message:
      'This statement will not be executed '.concat(
        adjacentStatements.includedStatementQualifier(),
        '; only the first statement will be. ',
      ) + 'The rest will execute '.concat(adjacentStatements.excludedStatementsQualifier(), '.'),
    node: adjacentStatements.next,
  });
}
function raiseBlockIssue(piledStatements, sizeOfPile, context) {
  context.report({
    message:
      'This line will not be executed '
        .concat(piledStatements.includedStatementQualifier(), '; only the first line of this ')
        .concat(sizeOfPile, '-line block will be. ') +
      'The rest will execute '.concat(piledStatements.excludedStatementsQualifier(), '.'),
    node: piledStatements.next,
  });
}
function raiseInlineAndIndentedIssue(chainedStatements, context) {
  context.report({
    message:
      'This line will not be executed '.concat(
        chainedStatements.includedStatementQualifier(),
        '; only the first statement will be. ',
      ) + 'The rest will execute '.concat(chainedStatements.excludedStatementsQualifier(), '.'),
    node: chainedStatements.next,
  });
}
function isNestingStatement(node) {
  return NestingStatementLike.includes(node.type);
}
var ChainedStatements = /** @class */ (function () {
  function ChainedStatements(topStatement, prev, next) {
    this.topStatement = topStatement;
    this.prev = prev;
    this.next = next;
    var topPosition = position(topStatement);
    var prevPosition = position(prev);
    var nextPosition = position(next);
    this.positions = {
      prevTopStart: topPosition.start,
      prevTopEnd: topPosition.end,
      prevStart: prevPosition.start,
      prevEnd: prevPosition.end,
      nextStart: nextPosition.start,
      nextEnd: nextPosition.end,
    };
  }
  ChainedStatements.prototype.areUnenclosed = function () {
    return this.prev.type !== 'BlockStatement';
  };
  ChainedStatements.prototype.areAdjacent = function () {
    return this.positions.prevEnd.line === this.positions.nextStart.line;
  };
  ChainedStatements.prototype.areBothIndented = function () {
    return (
      this.positions.prevStart.column === this.positions.nextStart.column && this.prevIsIndented()
    );
  };
  ChainedStatements.prototype.areInlinedAndIndented = function () {
    return (
      this.positions.prevStart.line === this.positions.prevTopEnd.line &&
      this.positions.nextStart.column > this.positions.prevTopStart.column
    );
  };
  ChainedStatements.prototype.includedStatementQualifier = function () {
    return this.topStatement.type === 'IfStatement' ? 'conditionally' : 'in a loop';
  };
  ChainedStatements.prototype.excludedStatementsQualifier = function () {
    return this.topStatement.type === 'IfStatement' ? 'unconditionally' : 'only once';
  };
  ChainedStatements.prototype.prevIsIndented = function () {
    return this.positions.prevStart.column > this.positions.prevTopStart.column;
  };
  return ChainedStatements;
})();
function position(node) {
  return node.loc;
}
