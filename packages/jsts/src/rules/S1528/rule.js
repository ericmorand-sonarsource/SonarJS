'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
exports.rule = {
  meta: {
    hasSuggestions: true,
  },
  create: function (context) {
    function checkNewExpression(node) {
      var newExpression = node;
      if (newExpression.callee.type === 'Identifier' && newExpression.callee.name === 'Array') {
        var message = 'Use either a literal or "Array.from()" instead of the "Array" constructor.';
        var suggest = [
          {
            desc: 'Replace with a literal',
            fix: replaceWithLiteralFix(newExpression, context),
          },
        ];
        if (
          newExpression.arguments.length === 1 &&
          newExpression.arguments[0].type === 'Literal' &&
          typeof newExpression.arguments[0].value === 'number'
        ) {
          message = 'Use "Array.from()" instead of the "Array" constructor.';
        }
        if (newExpression.arguments.length === 1) {
          suggest = [
            {
              desc: 'Replace with "Array.from()"',
              fix: replaceWithArrayFromFix(newExpression, context),
            },
          ];
        }
        context.report({ node: node, message: message, suggest: suggest });
      }
    }
    return {
      NewExpression: checkNewExpression,
    };
  },
};
function replaceWithLiteralFix(newExpression, context) {
  var argText = newExpression.arguments
    .map(function (arg) {
      return context.sourceCode.getText(arg);
    })
    .join(', ');
  return function (fixer) {
    return fixer.replaceText(newExpression, '['.concat(argText, ']'));
  };
}
function replaceWithArrayFromFix(newExpression, context) {
  var argText = context.sourceCode.getText(newExpression.arguments[0]);
  return function (fixer) {
    return fixer.replaceText(newExpression, 'Array.from({length: '.concat(argText, '})'));
  };
}
