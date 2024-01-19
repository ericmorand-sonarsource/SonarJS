'use strict';
/*
 * SonarQube JavaScript Plugin
 * Copyright (C) 2011-2024 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
// https://sonarsource.github.io/rspec/#/rspec/S5604/javascript
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
var helpers_1 = require('../helpers');
var permissions = ['geolocation', 'camera', 'microphone', 'notifications', 'persistent-storage'];
exports.rule = {
  meta: {
    messages: {
      checkPermission: 'Make sure the use of the {{feature}} is necessary.',
    },
  },
  create: function (context) {
    return {
      'CallExpression[callee.type="MemberExpression"]': function (node) {
        var call = node;
        var callee = call.callee;
        if (
          isNavigatorMemberExpression(callee, 'permissions', 'query') &&
          call.arguments.length > 0
        ) {
          checkPermissions(context, call);
          return;
        }
        if (
          context.options.includes('geolocation') &&
          isNavigatorMemberExpression(callee, 'geolocation', 'watchPosition', 'getCurrentPosition')
        ) {
          context.report({
            messageId: 'checkPermission',
            data: {
              feature: 'geolocation',
            },
            node: callee,
          });
          return;
        }
        if (
          isNavigatorMemberExpression(callee, 'mediaDevices', 'getUserMedia') &&
          call.arguments.length > 0
        ) {
          var firstArg = (0, helpers_1.getValueOfExpression)(
            context,
            call.arguments[0],
            'ObjectExpression',
          );
          checkForCameraAndMicrophonePermissions(context, callee, firstArg);
          return;
        }
        if (
          context.options.includes('notifications') &&
          (0, helpers_1.isMemberExpression)(callee, 'Notification', 'requestPermission')
        ) {
          context.report({
            messageId: 'checkPermission',
            data: {
              feature: 'notifications',
            },
            node: callee,
          });
          return;
        }
        if (
          context.options.includes('persistent-storage') &&
          (0, helpers_1.isMemberExpression)(callee.object, 'navigator', 'storage')
        ) {
          context.report({
            messageId: 'checkPermission',
            data: {
              feature: 'persistent-storage',
            },
            node: callee,
          });
        }
      },
      NewExpression: function (node) {
        var callee = node.callee;
        if (
          context.options.includes('notifications') &&
          (0, helpers_1.isIdentifier)(callee, 'Notification')
        ) {
          context.report({
            messageId: 'checkPermission',
            data: {
              feature: 'notifications',
            },
            node: callee,
          });
        }
      },
    };
  },
};
function checkForCameraAndMicrophonePermissions(context, callee, firstArg) {
  if (!firstArg) {
    return;
  }
  var shouldCheckAudio = context.options.includes('microphone');
  var shouldCheckVideo = context.options.includes('camera');
  if (!shouldCheckAudio && !shouldCheckVideo) {
    return;
  }
  var perms = [];
  for (var _i = 0, _a = firstArg.properties; _i < _a.length; _i++) {
    var prop = _a[_i];
    if (prop.type === 'Property') {
      var value = prop.value,
        key = prop.key;
      if (
        (0, helpers_1.isIdentifier)(key, 'audio') &&
        shouldCheckAudio &&
        isOtherThanFalse(context, value)
      ) {
        perms.push('microphone');
      } else if (
        (0, helpers_1.isIdentifier)(key, 'video') &&
        shouldCheckVideo &&
        isOtherThanFalse(context, value)
      ) {
        perms.push('camera');
      }
    }
  }
  if (perms.length > 0) {
    context.report({
      messageId: 'checkPermission',
      data: {
        feature: perms.join(' and '),
      },
      node: callee,
    });
  }
}
function isOtherThanFalse(context, value) {
  var exprValue = (0, helpers_1.getValueOfExpression)(context, value, 'Literal');
  if (exprValue && exprValue.value === false) {
    return false;
  }
  return true;
}
function checkPermissions(context, call) {
  var firstArg = (0, helpers_1.getValueOfExpression)(
    context,
    call.arguments[0],
    'ObjectExpression',
  );
  if ((firstArg === null || firstArg === void 0 ? void 0 : firstArg.type) === 'ObjectExpression') {
    var nameProp = firstArg.properties.find(function (prop) {
      return hasNamePropertyWithPermission(prop, context);
    });
    if (nameProp) {
      var value = nameProp.value.value;
      context.report({
        messageId: 'checkPermission',
        data: {
          feature: String(value),
        },
        node: nameProp,
      });
    }
  }
}
function isNavigatorMemberExpression(_a, firstProperty) {
  var object = _a.object,
    property = _a.property;
  var secondProperty = [];
  for (var _i = 2; _i < arguments.length; _i++) {
    secondProperty[_i - 2] = arguments[_i];
  }
  return (
    (0, helpers_1.isMemberExpression)(object, 'navigator', firstProperty) &&
    helpers_1.isIdentifier.apply(void 0, __spreadArray([property], secondProperty, false))
  );
}
function hasNamePropertyWithPermission(prop, context) {
  if (prop.type === 'Property' && (0, helpers_1.isIdentifier)(prop.key, 'name')) {
    var value = (0, helpers_1.getValueOfExpression)(context, prop.value, 'Literal');
    return (
      value &&
      typeof value.value === 'string' &&
      permissions.includes(value.value) &&
      context.options.includes(value.value)
    );
  }
  return false;
}
