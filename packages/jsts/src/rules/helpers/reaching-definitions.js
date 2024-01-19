'use strict';
var __extends =
  (this && this.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== 'function' && b !== null)
        throw new TypeError('Class extends value ' + String(b) + ' is not a constructor or null');
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
    };
  })();
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
exports.getVariableFromIdentifier =
  exports.resolveAssignedValues =
  exports.ReachingDefinitions =
  exports.reachingDefinitions =
  exports.unknownValue =
    void 0;
var AssignedValues = /** @class */ (function (_super) {
  __extends(AssignedValues, _super);
  function AssignedValues() {
    var _this = (_super !== null && _super.apply(this, arguments)) || this;
    _this.type = 'AssignedValues';
    return _this;
  }
  return AssignedValues;
})(Set);
var assignedValues = function (val) {
  return new AssignedValues([val]);
};
exports.unknownValue = {
  type: 'UnknownValue',
};
function reachingDefinitions(reachingDefinitionsMap) {
  var worklist = Array.from(reachingDefinitionsMap.values(), function (defs) {
    return defs.segment;
  });
  while (worklist.length > 0) {
    var current = worklist.pop();
    var reachingDefs = reachingDefinitionsMap.get(current.id);
    var outHasChanged = reachingDefs.propagate(reachingDefinitionsMap);
    if (outHasChanged) {
      current.nextSegments.forEach(function (next) {
        return worklist.push(next);
      });
    }
  }
}
exports.reachingDefinitions = reachingDefinitions;
var ReachingDefinitions = /** @class */ (function () {
  function ReachingDefinitions(segment) {
    this.in = new Map();
    this.out = new Map();
    /**
     * collects references in order they are evaluated, set in JS maintains insertion order
     */
    this.references = new Set();
    this.segment = segment;
  }
  ReachingDefinitions.prototype.add = function (ref) {
    var variable = ref.resolved;
    if (variable) {
      this.references.add(ref);
    }
  };
  ReachingDefinitions.prototype.propagate = function (reachingDefinitionsMap) {
    var _this = this;
    this.in.clear();
    this.segment.prevSegments.forEach(function (prev) {
      _this.join(reachingDefinitionsMap.get(prev.id).out);
    });
    var newOut = new Map(this.in);
    this.references.forEach(function (ref) {
      return _this.updateProgramState(ref, newOut);
    });
    if (!equals(this.out, newOut)) {
      this.out = newOut;
      return true;
    } else {
      return false;
    }
  };
  ReachingDefinitions.prototype.updateProgramState = function (ref, programState) {
    var variable = ref.resolved;
    if (!variable || !ref.isWrite()) {
      return;
    }
    if (!ref.writeExpr) {
      programState.set(variable, exports.unknownValue);
      return;
    }
    var rhsValues = resolveAssignedValues(variable, ref.writeExpr, programState, ref.from);
    programState.set(variable, rhsValues);
  };
  ReachingDefinitions.prototype.join = function (previousOut) {
    var _a;
    var _loop_1 = function (key, values) {
      var inValues =
        (_a = this_1.in.get(key)) !== null && _a !== void 0 ? _a : new AssignedValues();
      if (inValues.type === 'AssignedValues' && values.type === 'AssignedValues') {
        values.forEach(function (val) {
          return inValues.add(val);
        });
        this_1.in.set(key, inValues);
      } else {
        this_1.in.set(key, exports.unknownValue);
      }
    };
    var this_1 = this;
    for (var _i = 0, _b = previousOut.entries(); _i < _b.length; _i++) {
      var _c = _b[_i],
        key = _c[0],
        values = _c[1];
      _loop_1(key, values);
    }
  };
  return ReachingDefinitions;
})();
exports.ReachingDefinitions = ReachingDefinitions;
function resolveAssignedValues(lhsVariable, writeExpr, assignedValuesMap, scope) {
  if (!writeExpr) {
    return exports.unknownValue;
  }
  switch (writeExpr.type) {
    case 'Literal':
      return writeExpr.raw ? assignedValues(writeExpr.raw) : exports.unknownValue;
    case 'Identifier': {
      var resolvedVar = getVariableFromIdentifier(writeExpr, scope);
      if (resolvedVar && resolvedVar !== lhsVariable) {
        var resolvedAssignedValues = assignedValuesMap.get(resolvedVar);
        return resolvedAssignedValues !== null && resolvedAssignedValues !== void 0
          ? resolvedAssignedValues
          : exports.unknownValue;
      }
      return exports.unknownValue;
    }
    default:
      return exports.unknownValue;
  }
}
exports.resolveAssignedValues = resolveAssignedValues;
function equals(ps1, ps2) {
  if (ps1.size !== ps2.size) {
    return false;
  }
  for (var _i = 0, ps1_1 = ps1; _i < ps1_1.length; _i++) {
    var _a = ps1_1[_i],
      variable = _a[0],
      values1 = _a[1];
    var values2 = ps2.get(variable);
    if (!values2 || !valuesEquals(values2, values1)) {
      return false;
    }
  }
  return true;
}
function valuesEquals(a, b) {
  if (a.type === 'AssignedValues' && b.type === 'AssignedValues') {
    return setEquals(a, b);
  }
  return a === b;
}
function setEquals(a, b) {
  return (
    a.size === b.size &&
    __spreadArray([], a, true).every(function (e) {
      return b.has(e);
    })
  );
}
function getVariableFromIdentifier(identifier, scope) {
  var variable = scope.variables.find(function (value) {
    return value.name === identifier.name;
  });
  if (!variable && scope.upper) {
    variable = scope.upper.variables.find(function (value) {
      return value.name === identifier.name;
    });
  }
  return variable;
}
exports.getVariableFromIdentifier = getVariableFromIdentifier;
