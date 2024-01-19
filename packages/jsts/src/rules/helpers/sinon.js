'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.Sinon = void 0;
var _1 = require('.');
var Sinon;
(function (Sinon) {
  function isImported(context) {
    return (
      (0, _1.getRequireCalls)(context).some(function (r) {
        return r.arguments[0].type === 'Literal' && r.arguments[0].value === 'sinon';
      }) ||
      (0, _1.getImportDeclarations)(context).some(function (i) {
        return i.source.value === 'sinon';
      })
    );
  }
  Sinon.isImported = isImported;
  function isAssertion(context, node) {
    return isAssertUsage(context, node);
  }
  Sinon.isAssertion = isAssertion;
  function isAssertUsage(context, node) {
    // assert.<expr>(), sinon.assert.<expr>()
    var fqn = extractFQNforCallExpression(context, node);
    if (!fqn) {
      return false;
    }
    var names = fqn.split('.');
    return names.length === 3 && names[0] === 'sinon' && names[1] === 'assert';
  }
  function extractFQNforCallExpression(context, node) {
    if (node.type !== 'CallExpression') {
      return undefined;
    }
    return (0, _1.getFullyQualifiedName)(context, node);
  }
})(Sinon || (exports.Sinon = Sinon = {}));
