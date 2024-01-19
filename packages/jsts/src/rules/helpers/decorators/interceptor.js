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
Object.defineProperty(exports, '__esModule', { value: true });
exports.interceptReportForReact = exports.interceptReport = void 0;
var NUM_ARGS_NODE_MESSAGE = 2;
/**
 * Modifies the behavior of `context.report(descriptor)` for a given rule.
 *
 * Useful for performing additional checks before reporting an issue.
 *
 * @param rule the original rule
 * @param onReport replacement for `context.report(descr)`
 *                 invocations used inside of the rule
 * @param contextOverrider optional function to change the default context overridding mechanism
 */
function interceptReport(rule, onReport, contextOverrider) {
  return __assign(__assign({}, !!rule.meta && { meta: rule.meta }), {
    create: function (originalContext) {
      var interceptingContext;
      if (contextOverrider == null) {
        interceptingContext = {
          id: originalContext.id,
          options: originalContext.options,
          settings: originalContext.settings,
          parserPath: originalContext.parserPath,
          parserOptions: originalContext.parserOptions,
          parserServices: originalContext.parserServices,
          sourceCode: originalContext.sourceCode,
          cwd: originalContext.cwd,
          filename: originalContext.filename,
          physicalFilename: originalContext.physicalFilename,
          getCwd: function () {
            return originalContext.cwd;
          },
          getPhysicalFilename: function () {
            return originalContext.physicalFilename;
          },
          getAncestors: function () {
            return originalContext.getAncestors();
          },
          getDeclaredVariables: function (node) {
            return originalContext.getDeclaredVariables(node);
          },
          getFilename: function () {
            return originalContext.filename;
          },
          getScope: function () {
            return originalContext.getScope();
          },
          getSourceCode: function () {
            return originalContext.sourceCode;
          },
          markVariableAsUsed: function (name) {
            return originalContext.markVariableAsUsed(name);
          },
          report: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
              args[_i] = arguments[_i];
            }
            var descr = undefined;
            if (args.length === 1) {
              descr = args[0];
            } else if (args.length === NUM_ARGS_NODE_MESSAGE && typeof args[1] === 'string') {
              // not declared in the `.d.ts`, but used in practice by rules written in JS
              descr = {
                node: args[0],
                message: args[1],
              };
            }
            if (descr) {
              onReport(originalContext, descr);
            }
          },
        };
      } else {
        interceptingContext = contextOverrider(originalContext, onReport);
      }
      return rule.create(interceptingContext);
    },
  });
}
exports.interceptReport = interceptReport;
// interceptReport() by default doesn't work with the React plugin
// as the rules fail to find the context getFirstTokens() function.
function interceptReportForReact(rule, onReport) {
  return interceptReport(rule, onReport, contextOverriderForReact);
}
exports.interceptReportForReact = interceptReportForReact;
function contextOverriderForReact(context, onReport) {
  var overriddenReportContext = {
    report: function (reportDescriptor) {
      onReport(context, reportDescriptor);
    },
  };
  Object.setPrototypeOf(overriddenReportContext, context);
  return overriddenReportContext;
}
