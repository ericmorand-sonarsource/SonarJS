'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.Chai = void 0;
var _1 = require('.');
var Chai;
(function (Chai) {
  function isImported(context) {
    return (
      (0, _1.getRequireCalls)(context).some(function (r) {
        return r.arguments[0].type === 'Literal' && r.arguments[0].value === 'chai';
      }) ||
      (0, _1.getImportDeclarations)(context).some(function (i) {
        return i.source.value === 'chai';
      })
    );
  }
  Chai.isImported = isImported;
  function isAssertion(context, node) {
    return isAssertUsage(context, node) || isExpectUsage(context, node) || isShouldUsage(node);
  }
  Chai.isAssertion = isAssertion;
  function isAssertUsage(context, node) {
    // assert(), assert.<expr>(), chai.assert(), chai.assert.<expr>()
    var fqn = extractFQNforCallExpression(context, node);
    if (!fqn) {
      return false;
    }
    var names = fqn.split('.');
    return names[0] === 'chai' && names[1] === 'assert';
  }
  function isExpectUsage(context, node) {
    // expect(), chai.expect()
    return extractFQNforCallExpression(context, node) === 'chai.expect';
  }
  function isShouldUsage(node) {
    // <expr>.should.<expr>
    return node.type === 'MemberExpression' && (0, _1.isIdentifier)(node.property, 'should');
  }
  function extractFQNforCallExpression(context, node) {
    if (node.type !== 'CallExpression') {
      return undefined;
    }
    return (0, _1.getFullyQualifiedName)(context, node);
  }
})(Chai || (exports.Chai = Chai = {}));
