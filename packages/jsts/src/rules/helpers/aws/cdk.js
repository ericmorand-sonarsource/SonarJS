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
exports.normalizeFQN =
  exports.getLiteralValue =
  exports.AwsCdkCheckArguments =
  exports.AwsCdkTemplate =
    void 0;
var module_1 = require('../module');
var ast_1 = require('../ast');
var AWS_OPTIONS_ARGUMENT_POSITION = 2;
/**
 * A rule template for AWS CDK resources
 *
 * @param mapOrFactory callbacks to invoke when a new expression or a call expression matches a fully qualified name
 * @param metadata the rule metadata
 * @returns the instantiated rule module
 */
function AwsCdkTemplate(mapOrFactory, metadata) {
  if (metadata === void 0) {
    metadata = { meta: {} };
  }
  return __assign(__assign({}, metadata), {
    create: function (ctx) {
      var consumers = typeof mapOrFactory === 'function' ? mapOrFactory(ctx) : mapOrFactory;
      return {
        'NewExpression, CallExpression': function (node) {
          if (
            node.arguments.some(function (arg) {
              return arg.type === 'SpreadElement';
            })
          ) {
            return;
          }
          for (var fqn in consumers) {
            var normalizedExpectedFQN = normalizeFQN(fqn);
            var callback = consumers[fqn];
            if (typeof callback === 'object' || node.type === 'CallExpression') {
              executeIfMatching(node, normalizedExpectedFQN, callback);
              continue;
            }
            var normalizedActualFQN = normalizeFQN(
              (0, module_1.getFullyQualifiedName)(ctx, node.callee),
            );
            if (normalizedActualFQN === normalizedExpectedFQN) {
              callback(node, ctx);
            }
          }
        },
      };
      function executeIfMatching(node, expected, callback) {
        var _a;
        if (typeof callback === 'function') {
          return;
        }
        var fqn = normalizeFQN((0, module_1.getFullyQualifiedName)(ctx, node.callee));
        if (node.type === 'NewExpression' && fqn === expected) {
          (_a = callback.newExpression) === null || _a === void 0
            ? void 0
            : _a.call(callback, node, ctx);
        } else if (isMethodCall(callback, fqn, expected)) {
          callback.callExpression(node, ctx, fqn);
        }
      }
      function isMethodCall(callback, fqn, expected) {
        if (callback.functionName) {
          return fqn === ''.concat(expected, '.').concat(callback.functionName);
        } else if (
          callback.methods &&
          (fqn === null || fqn === void 0 ? void 0 : fqn.startsWith(expected))
        ) {
          var methodNames = fqn.substring(expected.length).split('.');
          var methods_1 = callback.methods;
          return methodNames.every(function (name) {
            return name === '' || methods_1.includes(name);
          });
        } else {
          return fqn === expected;
        }
      }
    },
  });
}
exports.AwsCdkTemplate = AwsCdkTemplate;
/**
 * Get the messageId at the given position from an array. If a string is used
 * instead of an array, return it
 * @param messageId Array of messageIds or single string if only one messageId is used
 * @param pos
 */
function getMessageAtPos(messageId, pos) {
  if (pos === void 0) {
    pos = 0;
  }
  if (typeof messageId === 'string') {
    return messageId;
  }
  return messageId[pos];
}
/**
 * Function to analyse arguments in a function and check for correct values. It will report if the
 * conditions are not met unless `silent = true`, in which case it will return boolean `true`
 * indicating conditions are not met.
 *
 * @param messageId Array of messageIds or single string if only one messageId is used. When an array is passed,
 *                  first messageId is used for omitted values and second for invalid values.
 * @param needsProps whether default (undefined) values are allowed or if it must be set
 * @param propertyName property name to search in the object (Array of strings for nested props)
 * @param values allowed or disallowed values
 * @param silent whether the function must report or just return conflicting Node when conditions are not met
 * @param position position of the argument to be analysed (3rd argument by default)
 */
function AwsCdkCheckArguments(messageId, needsProps, propertyName, values, silent, position) {
  if (silent === void 0) {
    silent = false;
  }
  if (position === void 0) {
    position = AWS_OPTIONS_ARGUMENT_POSITION;
  }
  return function (expr, ctx) {
    var argument = expr.arguments[position];
    // Argument not found or undefined
    if (!argument || (0, ast_1.isUndefined)(argument)) {
      if (needsProps) {
        if (silent) {
          return expr.callee;
        }
        ctx.report({ messageId: getMessageAtPos(messageId, 0), node: expr.callee });
      }
      return;
    }
    var properties = traverseProperties(
      { node: argument, nodeToReport: argument },
      typeof propertyName === 'string' ? [propertyName] : propertyName,
      ctx,
      getMessageAtPos(messageId, 0),
      needsProps,
      silent,
    );
    if (!Array.isArray(properties)) {
      return properties;
    }
    if (!(properties === null || properties === void 0 ? void 0 : properties.length)) {
      return;
    }
    for (var _i = 0, properties_1 = properties; _i < properties_1.length; _i++) {
      var property = properties_1[_i];
      var propertyValue = (0, ast_1.getUniqueWriteUsageOrNode)(ctx, property.node.value, true);
      if ((0, ast_1.isUnresolved)(propertyValue, ctx)) {
        continue;
      }
      /* Property is undefined or an empty array, which is the undefined equivalent
               for properties with an array-form where we expect multiple nested values */
      if (
        (0, ast_1.isUndefined)(propertyValue) ||
        (propertyValue.type === 'ArrayExpression' && !propertyValue.elements.length)
      ) {
        if (needsProps) {
          if (silent) {
            return getNodeToReport(property);
          }
          ctx.report({ messageId: getMessageAtPos(messageId, 0), node: getNodeToReport(property) });
        }
        continue;
      }
      // Value is expected to be a primitive (string, number)
      if (
        (values === null || values === void 0 ? void 0 : values.primitives) &&
        disallowedValue(ctx, propertyValue, values.primitives)
      ) {
        if (silent) {
          return getNodeToReport(property);
        }
        ctx.report({ messageId: getMessageAtPos(messageId, 1), node: getNodeToReport(property) });
      }
      // Value is expected to be an Identifier following a specific FQN
      if (
        (values === null || values === void 0 ? void 0 : values.fqns) &&
        disallowedFQNs(ctx, propertyValue, values.fqns)
      ) {
        if (silent) {
          return getNodeToReport(property);
        }
        ctx.report({ messageId: getMessageAtPos(messageId, 1), node: getNodeToReport(property) });
      }
      // The value needs to be validated with a customized function
      if (
        (values === null || values === void 0 ? void 0 : values.customChecker) &&
        values.customChecker(ctx, propertyValue)
      ) {
        if (silent) {
          return getNodeToReport(property);
        }
        ctx.report({ messageId: getMessageAtPos(messageId, 1), node: getNodeToReport(property) });
      }
    }
  };
}
exports.AwsCdkCheckArguments = AwsCdkCheckArguments;
function getNodeToReport(property) {
  if (property.nodeToReport.type === 'Property') {
    return property.nodeToReport.value;
  }
  return property.nodeToReport;
}
/**
 * Given an object expression, check for [nested] attributes. If at some level an
 * array is found, the search for next level properties will be performed on each element
 * of the array.
 *
 * @returns an array of Nodes which have the given property path.
 *
 * @param node node to look for the next property.
 * @param propertyPath pending property paths to traverse
 * @param ctx rule context
 * @param messageId messageId to report when path cannot be met and silent = `false`
 * @param needsProp whether missing (undefined) values are allowed or if it must be set
 * @param silent whether the function must report or just return conflicting Node when conditions are not met
 */
function traverseProperties(node, propertyPath, ctx, messageId, needsProp, silent) {
  var propertyName = propertyPath[0],
    nextElements = propertyPath.slice(1);
  var properties = [];
  var children = [];
  if ((0, ast_1.isUnresolved)(node.node, ctx)) {
    return [];
  }
  var objExpr = (0, ast_1.getValueOfExpression)(ctx, node.node, 'ObjectExpression', true);
  if (objExpr === undefined) {
    var arrayExpr = (0, ast_1.getValueOfExpression)(ctx, node.node, 'ArrayExpression', true);
    if (arrayExpr === undefined || !arrayExpr.elements.length) {
      if (needsProp) {
        if (silent) {
          return node.nodeToReport;
        }
        ctx.report({ messageId: messageId, node: node.nodeToReport });
      }
      return [];
    }
    for (var _i = 0, _a = arrayExpr.elements; _i < _a.length; _i++) {
      var element = _a[_i];
      var elemObjExpr = (0, ast_1.getValueOfExpression)(ctx, element, 'ObjectExpression', true);
      if (elemObjExpr && element) {
        children.push({ node: elemObjExpr, nodeToReport: element });
      }
    }
  } else {
    children.push({ node: objExpr, nodeToReport: node.nodeToReport });
  }
  for (var _b = 0, children_1 = children; _b < children_1.length; _b++) {
    var child = children_1[_b];
    var property = (0, ast_1.getProperty)(child.node, propertyName, ctx);
    if (property === undefined) {
      continue;
    }
    if (!property) {
      if (needsProp) {
        if (silent) {
          return node.nodeToReport;
        }
        ctx.report({ messageId: messageId, node: node.nodeToReport });
      }
      continue;
    }
    if (nextElements.length) {
      if (child.node === child.nodeToReport && child.node.properties.includes(property)) {
        child.nodeToReport = property.value;
      }
      child.node = property.value;
      var nextElementChildren = traverseProperties(
        child,
        nextElements,
        ctx,
        messageId,
        needsProp,
        silent,
      );
      if (!Array.isArray(nextElementChildren)) {
        return nextElementChildren;
      }
      properties.push.apply(properties, nextElementChildren);
    } else {
      if (child.node === child.nodeToReport && child.node.properties.includes(property)) {
        child.nodeToReport = property;
      }
      child.node = property;
      properties.push(child);
    }
  }
  return properties;
}
function disallowedValue(ctx, node, values) {
  var _a, _b;
  var literal = getLiteralValue(ctx, node);
  if (literal) {
    if ((_a = values.valid) === null || _a === void 0 ? void 0 : _a.length) {
      var found = values.valid.some(function (value) {
        if (values.case_insensitive && typeof literal.value === 'string') {
          return value.toLowerCase() === literal.value.toLowerCase();
        }
        return value === literal.value;
      });
      if (!found) {
        return true;
      }
    }
    if ((_b = values.invalid) === null || _b === void 0 ? void 0 : _b.length) {
      var found = values.invalid.some(function (value) {
        if (values.case_insensitive && typeof literal.value === 'string') {
          return value.toLowerCase() === literal.value.toLowerCase();
        }
        return value === literal.value;
      });
      if (found) {
        return true;
      }
    }
  }
  return false;
}
function getLiteralValue(ctx, node) {
  if ((0, ast_1.isLiteral)(node)) {
    return node;
  } else if ((0, ast_1.isIdentifier)(node)) {
    var usage = (0, ast_1.getUniqueWriteUsage)(ctx, node.name);
    if (usage) {
      return getLiteralValue(ctx, usage);
    }
  }
  return undefined;
}
exports.getLiteralValue = getLiteralValue;
function disallowedFQNs(ctx, node, values) {
  var _a, _b;
  var normalizedFQN = normalizeFQN((0, module_1.getFullyQualifiedName)(ctx, node));
  if (
    ((_a = values.valid) === null || _a === void 0 ? void 0 : _a.length) &&
    (!normalizedFQN || !values.valid.map(normalizeFQN).includes(normalizedFQN))
  ) {
    return true;
  }
  return (
    normalizedFQN &&
    ((_b = values.invalid) === null || _b === void 0
      ? void 0
      : _b.map(normalizeFQN).includes(normalizedFQN))
  );
}
function normalizeFQN(fqn) {
  return fqn === null || fqn === void 0 ? void 0 : fqn.replace(/-/g, '_');
}
exports.normalizeFQN = normalizeFQN;
