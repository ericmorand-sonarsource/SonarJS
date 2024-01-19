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
exports.mergeRules = void 0;
/**
 * Merges the listeners of an arbitrary number of ESLint-based rules
 *
 * The purpose of this helper function is to merge the behaviour of a
 * variable number of rules. An ESLint rule "listens to" node visits based
 * on a node selector. If the node selector matches, the listener then
 * invokes a callback to proceed further with the node being visited.
 *
 * It supports when multiple rules share the same listeners, e.g., 2 rules
 * listen to `CallExpression` node visits. They will be run one after the other.
 *
 * @param rules rules to merge
 * @returns the merge of the rules' listeners
 */
function mergeRules() {
  var rules = [];
  for (var _i = 0; _i < arguments.length; _i++) {
    rules[_i] = arguments[_i];
  }
  var merged = Object.assign.apply(Object, __spreadArray([{}], rules, false));
  var _loop_1 = function (listener) {
    merged[listener] = mergeListeners.apply(
      void 0,
      rules.map(function (rule) {
        return rule[listener];
      }),
    );
  };
  for (var _a = 0, _b = Object.keys(merged); _a < _b.length; _a++) {
    var listener = _b[_a];
    _loop_1(listener);
  }
  return merged;
}
exports.mergeRules = mergeRules;
function mergeListeners() {
  var listeners = [];
  for (var _i = 0; _i < arguments.length; _i++) {
    listeners[_i] = arguments[_i];
  }
  return function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }
    for (var _a = 0, listeners_1 = listeners; _a < listeners_1.length; _a++) {
      var listener = listeners_1[_a];
      if (listener) {
        listener.apply(void 0, args);
      }
    }
  };
}
