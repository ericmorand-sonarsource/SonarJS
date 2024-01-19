'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var detectReactSelector = [
  ':matches(',
  [
    'CallExpression[callee.name="require"][arguments.0.value="react"]',
    'CallExpression[callee.name="require"][arguments.0.value="create-react-class"]',
    'ImportDeclaration[source.value="react"]',
  ].join(','),
  ')',
].join('');
exports.rule = {
  meta: {
    messages: {
      reactDetected: 'React detected',
    },
  },
  create: function (context) {
    var _a;
    return (
      (_a = {}),
      (_a[detectReactSelector] = function (node) {
        context.report({
          messageId: 'reactDetected',
          node: node,
        });
      }),
      _a
    );
  },
};
