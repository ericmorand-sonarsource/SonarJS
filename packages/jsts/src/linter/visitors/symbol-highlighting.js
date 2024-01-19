'use strict';
var __spreadArray =
  (this && this.__spreadArray) ||
  function (to, from, pack) {
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from));
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('./metrics/helpers');
/**
 * A rule for computing the symbol highlighting of the source code
 *
 * We use an ESLint rule as we need to access declared variables which
 * are only available only through the rule context.
 */
exports.rule = {
  create: function (context) {
    var variables;
    /*
           Remove TypeAnnotation part from location of identifier for purpose of symbol highlighting.
           This was motivated by following code
    
             var XMLHttpRequest: {
               new(): XMLHttpRequest; // this is reference to var, not interface
             };
             interface XMLHttpRequest  {}
    
           where XMLHttpRequest is both type and variable name. Issue type annotation inside the variable declaration
           is reference to the variable (this is likely a bug in parser), which causes overlap between declaration and
           reference, which makes SQ API fail with RuntimeException. As a workaround we remove TypeAnnotation part of
           identifier node from its location, so no overlap is possible (arguably this is also better UX for symbol
           highlighting).
         */
    function identifierLocation(node) {
      var source = context.sourceCode;
      var loc = {
        start: node.loc.start,
        end:
          node.type === 'Identifier' && node.typeAnnotation
            ? source.getLocFromIndex(node.typeAnnotation.range[0])
            : node.loc.end,
      };
      return (0, helpers_1.convertLocation)(loc);
    }
    return {
      Program: function () {
        // clear "variables" for each file
        variables = new Set();
      },
      '*': function (node) {
        context.getDeclaredVariables(node).forEach(function (v) {
          return variables.add(v);
        });
      },
      'Program:exit': function (node) {
        var result = [];
        variables.forEach(function (v) {
          // if variable is initialized during declaration it is part of references as well
          // so we merge declarations and references to remove duplicates and take the earliest in the file as the declaration
          var allRef = __spreadArray(
            [],
            new Set(
              __spreadArray(
                __spreadArray(
                  [],
                  v.defs.map(function (d) {
                    return d.name;
                  }),
                  true,
                ),
                v.references.map(function (r) {
                  return r.identifier;
                }),
                true,
              ),
            ),
            true,
          )
            .filter(function (i) {
              return !!i.loc;
            })
            .sort(function (a, b) {
              return a.loc.start.line - b.loc.start.line;
            });
          if (allRef.length === 0) {
            // defensive check, this should never happen
            return;
          }
          var highlightedSymbol = {
            declaration: identifierLocation(allRef[0]),
            references: allRef.slice(1).map(function (r) {
              return identifierLocation(r);
            }),
          };
          result.push(highlightedSymbol);
        });
        var openCurlyBracesStack = [];
        var openHtmlTagsStack = [];
        (0, helpers_1.extractTokensAndComments)(context.sourceCode).tokens.forEach(function (
          token,
        ) {
          switch (token.type) {
            case 'Punctuator':
              if (token.value === '{') {
                openCurlyBracesStack.push(token);
              } else if (token.value === '}') {
                var highlightedSymbol = {
                  declaration: (0, helpers_1.convertLocation)(openCurlyBracesStack.pop().loc),
                  references: [(0, helpers_1.convertLocation)(token.loc)],
                };
                result.push(highlightedSymbol);
              }
              break;
            case 'HTMLTagOpen':
              openHtmlTagsStack.push(token);
              break;
            case 'HTMLSelfClosingTagClose':
              openHtmlTagsStack.pop();
              break;
            case 'HTMLEndTagOpen': {
              var openHtmlTag = openHtmlTagsStack.pop();
              if (openHtmlTag) {
                var highlightedSymbol = {
                  declaration: (0, helpers_1.convertLocation)(openHtmlTag.loc),
                  references: [(0, helpers_1.convertLocation)(token.loc)],
                };
                result.push(highlightedSymbol);
              }
              break;
            }
          }
        });
        // as issues are the only communication channel of a rule
        // we pass data as serialized json as an issue message
        context.report({ node: node, message: JSON.stringify(result) });
      },
    };
  },
};
