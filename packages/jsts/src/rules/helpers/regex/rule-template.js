'use strict';
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod)
        if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  };
var __rest =
  (this && this.__rest) ||
  function (s, e) {
    var t = {};
    for (var p in s)
      if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === 'function')
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
          t[p[i]] = s[p[i]];
      }
    return t;
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.createRegExpRule = void 0;
var regexpp = __importStar(require('@eslint-community/regexpp'));
var ast_1 = require('./ast');
var extract_1 = require('./extract');
var location_1 = require('./location');
var __1 = require('..');
/**
 * Rule template to create regex rules.
 * @param handlers - the regexpp node handlers
 * @param meta - the (optional) rule metadata
 * @returns the resulting rule module
 */
function createRegExpRule(handlers, metadata) {
  if (metadata === void 0) {
    metadata = { meta: {} };
  }
  return __assign(__assign({}, metadata), {
    create: function (context) {
      var services = (0, __1.isRequiredParserServices)(context.sourceCode.parserServices)
        ? context.sourceCode.parserServices
        : null;
      function checkRegex(node, regExpAST) {
        if (!regExpAST) {
          return;
        }
        var ctx = Object.create(context);
        ctx.node = node;
        ctx.reportRegExpNode = reportRegExpNode;
        regexpp.visitRegExpAST(regExpAST, handlers(ctx));
      }
      function reportRegExpNode(descriptor) {
        var node = descriptor.node,
          regexpNode = descriptor.regexpNode,
          _a = descriptor.offset,
          offset = _a === void 0 ? [0, 0] : _a,
          rest = __rest(descriptor, ['node', 'regexpNode', 'offset']);
        var loc = (0, location_1.getRegexpLocation)(node, regexpNode, context, offset);
        if (loc) {
          context.report(__assign(__assign({}, rest), { loc: loc }));
        }
      }
      function checkLiteral(literal) {
        checkRegex(literal, (0, extract_1.getParsedRegex)(literal, context));
      }
      function checkCallExpression(callExpr) {
        var parsedRegex = (0, extract_1.getParsedRegex)(callExpr, context);
        if (!parsedRegex && services && (0, ast_1.isStringRegexMethodCall)(callExpr, services)) {
          var implicitRegex = callExpr.arguments[0];
          parsedRegex = (0, extract_1.getParsedRegex)(implicitRegex, context);
        }
        checkRegex(callExpr.arguments[0], parsedRegex);
      }
      return {
        'Literal[regex]': checkLiteral,
        NewExpression: checkCallExpression,
        CallExpression: checkCallExpression,
      };
    },
  });
}
exports.createRegExpRule = createRegExpRule;
