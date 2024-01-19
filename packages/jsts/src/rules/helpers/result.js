'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.getResultOfExpression = exports.Result = void 0;
var ast_1 = require('./ast');
var Result = /** @class */ (function () {
  function Result(ctx, node, status) {
    this.ctx = ctx;
    this.node = node;
    this.status = status;
  }
  Object.defineProperty(Result.prototype, 'isFound', {
    get: function () {
      return this.status === 'found';
    },
    enumerable: false,
    configurable: true,
  });
  Object.defineProperty(Result.prototype, 'isMissing', {
    get: function () {
      return this.status === 'missing';
    },
    enumerable: false,
    configurable: true,
  });
  Object.defineProperty(Result.prototype, 'isTrue', {
    get: function () {
      return this.isFound && (0, ast_1.isBooleanLiteral)(this.node) && this.node.value;
    },
    enumerable: false,
    configurable: true,
  });
  Result.prototype.ofType = function (type) {
    return this.isFound && this.node.type === type;
  };
  Result.prototype.getArgument = function (position) {
    if (!this.isFound) {
      return this;
    } else if (this.node.type !== 'NewExpression' && this.node.type !== 'CallExpression') {
      return unknown(this.ctx, this.node);
    }
    var argument = this.node.arguments[position];
    if (argument == null) {
      return missing(this.ctx, this.node);
    } else {
      return getResultOfExpression(this.ctx, argument);
    }
  };
  Result.prototype.getProperty = function (propertyName) {
    if (!this.isFound) {
      return this;
    } else if (this.node.type !== 'ObjectExpression') {
      return unknown(this.ctx, this.node);
    }
    var property = (0, ast_1.getProperty)(this.node, propertyName, this.ctx);
    if (property === undefined) {
      return unknown(this.ctx, this.node);
    } else if (property === null) {
      return missing(this.ctx, this.node);
    } else {
      return getResultOfExpression(this.ctx, property.value);
    }
  };
  Result.prototype.getMemberObject = function () {
    if (!this.isFound) {
      return this;
    } else if (this.node.type !== 'MemberExpression') {
      return unknown(this.ctx, this.node);
    } else {
      return getResultOfExpression(this.ctx, this.node.object).filter(function (n) {
        return n.type !== 'Super';
      });
    }
  };
  Result.prototype.findInArray = function (closure) {
    var _a;
    if (!this.isFound) {
      return this;
    } else if (!(0, ast_1.isArrayExpression)(this.node)) {
      return unknown(this.ctx, this.node);
    }
    var isMissing = true;
    for (var _i = 0, _b = this.node.elements; _i < _b.length; _i++) {
      var element = _b[_i];
      var result = element != null ? closure(getResultOfExpression(this.ctx, element)) : null;
      if (result === null || result === void 0 ? void 0 : result.isFound) {
        return result;
      }
      isMissing &&
        (isMissing =
          (_a = result === null || result === void 0 ? void 0 : result.isMissing) !== null &&
          _a !== void 0
            ? _a
            : true);
    }
    return isMissing ? missing(this.ctx, this.node) : unknown(this.ctx, this.node);
  };
  Result.prototype.everyStringLiteral = function (closure) {
    if (!this.isFound) {
      return false;
    } else if ((0, ast_1.isStringLiteral)(this.node)) {
      return closure(this.node);
    } else if (!(0, ast_1.isArrayExpression)(this.node)) {
      return false;
    }
    for (var _i = 0, _a = this.node.elements; _i < _a.length; _i++) {
      var element = _a[_i];
      var child = element == null ? null : getResultOfExpression(this.ctx, element);
      if (
        !(child === null || child === void 0 ? void 0 : child.isFound) ||
        !(0, ast_1.isStringLiteral)(child.node) ||
        !closure(child.node)
      ) {
        return false;
      }
    }
    return true;
  };
  Result.prototype.asStringLiterals = function () {
    if (!this.isFound) {
      return [];
    }
    var values = [];
    if ((0, ast_1.isArrayExpression)(this.node)) {
      for (var _i = 0, _a = this.node.elements; _i < _a.length; _i++) {
        var arg = _a[_i];
        var result = arg == null ? null : getResultOfExpression(this.ctx, arg);
        if (
          (result === null || result === void 0 ? void 0 : result.isFound) &&
          (0, ast_1.isStringLiteral)(result.node)
        ) {
          values.push(result.node);
        }
      }
    } else if ((0, ast_1.isStringLiteral)(this.node)) {
      values.push(this.node);
    }
    return values;
  };
  Result.prototype.map = function (closure) {
    return !this.isFound ? null : closure(this.node);
  };
  Result.prototype.filter = function (closure) {
    if (!this.isFound) {
      return this;
    }
    return !closure(this.node, this.ctx) ? unknown(this.ctx, this.node) : this;
  };
  return Result;
})();
exports.Result = Result;
function unknown(ctx, node) {
  return new Result(ctx, node, 'unknown');
}
function missing(ctx, node) {
  return new Result(ctx, node, 'missing');
}
function found(ctx, node) {
  return new Result(ctx, node, 'found');
}
function getResultOfExpression(ctx, node) {
  var value = (0, ast_1.getUniqueWriteUsageOrNode)(ctx, node, true);
  return (0, ast_1.isUndefined)(value) ? missing(ctx, value) : found(ctx, value);
}
exports.getResultOfExpression = getResultOfExpression;
