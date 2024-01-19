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
exports.LiveVariables = exports.lva = void 0;
function lva(liveVariablesMap) {
  var worklist = Array.from(liveVariablesMap.values(), function (lva) {
    return lva.segment;
  });
  while (worklist.length > 0) {
    var current = worklist.pop();
    var liveVariables = liveVariablesMap.get(current.id);
    var liveInHasChanged = liveVariables.propagate(liveVariablesMap);
    if (liveInHasChanged) {
      current.prevSegments.forEach(function (prev) {
        return worklist.push(prev);
      });
    }
  }
}
exports.lva = lva;
var LiveVariables = /** @class */ (function () {
  function LiveVariables(segment) {
    /**
     * variables that are being read in the block
     */
    this.gen = new Set();
    /**
     * variables that are being written in the block
     */
    this.kill = new Set();
    /**
     * variables needed by this or a successor block and are not killed in this block
     */
    this.in = new Set();
    /**
     * variables needed by successors
     */
    this.out = [];
    /**
     * collects references in order they are evaluated, set in JS maintains insertion order
     */
    this.references = new Set();
    this.segment = segment;
  }
  LiveVariables.prototype.add = function (ref) {
    var variable = ref.resolved;
    if (variable) {
      if (ref.isRead()) {
        this.gen.add(variable);
      }
      if (ref.isWrite()) {
        this.kill.add(variable);
      }
      this.references.add(ref);
    }
  };
  LiveVariables.prototype.propagate = function (liveVariablesMap) {
    var out = [];
    this.segment.nextSegments.forEach(function (next) {
      out.push.apply(out, liveVariablesMap.get(next.id).in);
    });
    var diff = difference(out, this.kill);
    this.out = out;
    if (shouldUpdate(this.in, this.gen, diff)) {
      this.in = new Set(__spreadArray(__spreadArray([], this.gen, true), diff, true));
      return true;
    } else {
      return false;
    }
  };
  return LiveVariables;
})();
exports.LiveVariables = LiveVariables;
function difference(a, b) {
  if (b.size === 0) {
    return a;
  }
  var diff = [];
  for (var _i = 0, a_1 = a; _i < a_1.length; _i++) {
    var e = a_1[_i];
    if (!b.has(e)) {
      diff.push(e);
    }
  }
  return diff;
}
function shouldUpdate(inSet, gen, diff) {
  for (var _i = 0, gen_1 = gen; _i < gen_1.length; _i++) {
    var e = gen_1[_i];
    if (!inSet.has(e)) {
      return true;
    }
  }
  for (var _a = 0, diff_1 = diff; _a < diff_1.length; _a++) {
    var e = diff_1[_a];
    if (!inSet.has(e)) {
      return true;
    }
  }
  return false;
}
