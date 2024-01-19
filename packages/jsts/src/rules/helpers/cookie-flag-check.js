'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.CookieFlagCheck = void 0;
var _1 = require('.');
var CookieFlagCheck = /** @class */ (function () {
  function CookieFlagCheck(context, flag) {
    this.context = context;
    this.flag = flag;
    this.issueMessage = 'Make sure creating this cookie without the "'.concat(
      flag,
      '" flag is safe.',
    );
  }
  CookieFlagCheck.prototype.checkCookieSession = function (callExpression) {
    // Sensitive argument for cookie session is first one
    this.checkSensitiveCookieArgument(callExpression, 0);
  };
  CookieFlagCheck.prototype.checkCookiesMethodCall = function (callExpression) {
    if (!(0, _1.isIdentifier)(callExpression.callee.property, 'set')) {
      return;
    }
    // Sensitive argument is third argument for "cookies.set" calls
    this.checkSensitiveCookieArgument(callExpression, 2);
  };
  CookieFlagCheck.prototype.checkCsurf = function (callExpression) {
    // Sensitive argument is first for csurf
    var cookieProperty = this.checkSensitiveObjectArgument(callExpression, 0);
    if (cookieProperty) {
      // csurf cookie property can be passed as a boolean literal,
      // in which case neither "secure" nor "httponly" are enabled by default
      var cookiePropertyLiteral = (0, _1.getValueOfExpression)(
        this.context,
        cookieProperty.value,
        'Literal',
      );
      if (
        (cookiePropertyLiteral === null || cookiePropertyLiteral === void 0
          ? void 0
          : cookiePropertyLiteral.value) === true
      ) {
        this.context.report({
          node: callExpression.callee,
          message: (0, _1.toEncodedMessage)(this.issueMessage, [cookiePropertyLiteral]),
        });
      }
    }
  };
  CookieFlagCheck.prototype.checkExpressSession = function (callExpression) {
    // Sensitive argument is first for express-session
    this.checkSensitiveObjectArgument(callExpression, 0);
  };
  CookieFlagCheck.prototype.checkSensitiveCookieArgument = function (
    callExpression,
    sensitiveArgumentIndex,
  ) {
    if (callExpression.arguments.length < sensitiveArgumentIndex + 1) {
      return;
    }
    var sensitiveArgument = callExpression.arguments[sensitiveArgumentIndex];
    var cookieObjectExpression = (0, _1.getValueOfExpression)(
      this.context,
      sensitiveArgument,
      'ObjectExpression',
    );
    if (!cookieObjectExpression) {
      return;
    }
    this.checkFlagOnCookieExpression(
      cookieObjectExpression,
      sensitiveArgument,
      cookieObjectExpression,
      callExpression,
    );
  };
  CookieFlagCheck.prototype.checkSensitiveObjectArgument = function (
    callExpression,
    argumentIndex,
  ) {
    if (callExpression.arguments.length < argumentIndex + 1) {
      return;
    }
    var firstArgument = callExpression.arguments[argumentIndex];
    var objectExpression = (0, _1.getValueOfExpression)(
      this.context,
      firstArgument,
      'ObjectExpression',
    );
    if (!objectExpression) {
      return;
    }
    var cookieProperty = (0, _1.getObjectExpressionProperty)(objectExpression, 'cookie');
    if (!cookieProperty) {
      return;
    }
    var cookiePropertyValue = (0, _1.getValueOfExpression)(
      this.context,
      cookieProperty.value,
      'ObjectExpression',
    );
    if (cookiePropertyValue) {
      this.checkFlagOnCookieExpression(
        cookiePropertyValue,
        firstArgument,
        objectExpression,
        callExpression,
      );
      return;
    }
    return cookieProperty;
  };
  CookieFlagCheck.prototype.checkFlagOnCookieExpression = function (
    cookiePropertyValue,
    firstArgument,
    objectExpression,
    callExpression,
  ) {
    var flagProperty = (0, _1.getObjectExpressionProperty)(cookiePropertyValue, this.flag);
    if (flagProperty) {
      var flagPropertyValue = (0, _1.getValueOfExpression)(
        this.context,
        flagProperty.value,
        'Literal',
      );
      if (
        (flagPropertyValue === null || flagPropertyValue === void 0
          ? void 0
          : flagPropertyValue.value) === false
      ) {
        var secondaryLocations = [flagPropertyValue];
        if (firstArgument !== objectExpression) {
          secondaryLocations.push(objectExpression);
        }
        this.context.report({
          node: callExpression.callee,
          message: (0, _1.toEncodedMessage)(this.issueMessage, secondaryLocations),
        });
      }
    }
  };
  CookieFlagCheck.prototype.checkCookiesFromCallExpression = function (node) {
    var callExpression = node;
    var callee = callExpression.callee;
    var fqn = (0, _1.getFullyQualifiedName)(this.context, callee);
    if (fqn === 'cookie-session') {
      this.checkCookieSession(callExpression);
      return;
    }
    if (fqn === 'csurf') {
      this.checkCsurf(callExpression);
      return;
    }
    if (fqn === 'express-session') {
      this.checkExpressSession(callExpression);
      return;
    }
    if (callee.type === 'MemberExpression') {
      var objectValue = (0, _1.getValueOfExpression)(this.context, callee.object, 'NewExpression');
      if (
        objectValue &&
        (0, _1.getFullyQualifiedName)(this.context, objectValue.callee) === 'cookies'
      ) {
        this.checkCookiesMethodCall(callExpression);
      }
    }
  };
  return CookieFlagCheck;
})();
exports.CookieFlagCheck = CookieFlagCheck;
