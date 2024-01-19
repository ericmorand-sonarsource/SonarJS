'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var linter_1 = require('../../linter');
var helpers_1 = require('../helpers');
/**
 * We assume that the user is using a single assertion library per file,
 * this is why we are not saving if an assertion has been performed for
 * libX and the imported library was libY.
 */
exports.rule = {
  create: function (context) {
    var visitedNodes = new Set();
    var potentialIssues = [];
    return {
      'CallExpression:exit': function (node) {
        var testCase = helpers_1.Mocha.extractTestCase(node);
        if (testCase !== null) {
          checkAssertions(testCase, context, potentialIssues, visitedNodes);
        }
      },
      'Program:exit': function () {
        if (
          helpers_1.Chai.isImported(context) ||
          helpers_1.Sinon.isImported(context) ||
          helpers_1.Vitest.isImported(context)
        ) {
          potentialIssues.forEach(function (issue) {
            context.report(issue);
          });
        }
      },
    };
  },
};
function checkAssertions(testCase, context, potentialIssues, visitedNodes) {
  var node = testCase.node,
    callback = testCase.callback;
  var visitor = new TestCaseAssertionVisitor(context);
  visitor.visit(context, callback.body, visitedNodes);
  if (visitor.missingAssertions()) {
    potentialIssues.push({ node: node, message: 'Add at least one assertion to this test case.' });
  }
}
var TestCaseAssertionVisitor = /** @class */ (function () {
  function TestCaseAssertionVisitor(context) {
    this.context = context;
    this.visitorKeys = context.sourceCode.visitorKeys;
    this.hasAssertions = false;
  }
  TestCaseAssertionVisitor.prototype.visit = function (context, node, visitedNodes) {
    if (visitedNodes.has(node)) {
      return;
    }
    visitedNodes.add(node);
    if (this.hasAssertions) {
      return;
    }
    if (
      helpers_1.Chai.isAssertion(context, node) ||
      helpers_1.Sinon.isAssertion(context, node) ||
      helpers_1.Vitest.isAssertion(context, node)
    ) {
      this.hasAssertions = true;
      return;
    }
    if ((0, helpers_1.isFunctionCall)(node)) {
      var functionDef = (0, helpers_1.resolveFunction)(this.context, node.callee);
      if (functionDef) {
        this.visit(context, functionDef.body, visitedNodes);
      }
    }
    for (var _i = 0, _a = (0, linter_1.childrenOf)(node, this.visitorKeys); _i < _a.length; _i++) {
      var child = _a[_i];
      this.visit(context, child, visitedNodes);
    }
  };
  TestCaseAssertionVisitor.prototype.missingAssertions = function () {
    return !this.hasAssertions;
  };
  return TestCaseAssertionVisitor;
})();
