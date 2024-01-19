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
// https://sonarsource.github.io/rspec/#/rspec/S2598/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.getVariablePropertyFromAssignment = exports.rule = void 0;
var helpers_1 = require('../helpers');
var parameters_1 = require('../../linter/parameters');
var FORMIDABLE_MODULE = 'formidable';
var KEEP_EXTENSIONS = 'keepExtensions';
var UPLOAD_DIR = 'uploadDir';
var MULTER_MODULE = 'multer';
var STORAGE_OPTION = 'storage';
var DESTINATION_OPTION = 'destination';
var formidableObjects = new Map();
exports.rule = {
  meta: {
    schema: [
      {
        // internal parameter for rules having secondary locations
        enum: [parameters_1.SONAR_RUNTIME],
      },
    ],
  },
  create: function (context) {
    return {
      NewExpression: function (node) {
        checkCallExpression(context, node);
      },
      CallExpression: function (node) {
        checkCallExpression(context, node);
      },
      AssignmentExpression: function (node) {
        visitAssignment(context, node);
      },
      Program: function () {
        formidableObjects.clear();
      },
      'Program:exit': function () {
        formidableObjects.forEach(function (value) {
          return report(context, value.uploadDirSet, value.keepExtensions, value.callExpression);
        });
      },
    };
  },
};
function checkCallExpression(context, callExpression) {
  var callee = callExpression.callee;
  if (callee.type !== 'Identifier') {
    return;
  }
  var fqn = (0, helpers_1.getFullyQualifiedName)(context, callee);
  if (!fqn) {
    return;
  }
  var moduleName = fqn.split('.')[0];
  if (moduleName === FORMIDABLE_MODULE) {
    checkFormidable(context, callExpression);
  }
  if (moduleName === MULTER_MODULE) {
    checkMulter(context, callExpression);
  }
}
function checkFormidable(context, callExpression) {
  var _a;
  if (callExpression.arguments.length === 0) {
    var formVariable = (0, helpers_1.getLhsVariable)(context);
    if (formVariable) {
      formidableObjects.set(formVariable, {
        uploadDirSet: false,
        keepExtensions: false,
        callExpression: callExpression,
      });
    }
    return;
  }
  var options = (0, helpers_1.getValueOfExpression)(
    context,
    callExpression.arguments[0],
    'ObjectExpression',
  );
  if (options) {
    report(
      context,
      !!(0, helpers_1.getObjectExpressionProperty)(options, UPLOAD_DIR),
      keepExtensionsValue(
        (_a = (0, helpers_1.getObjectExpressionProperty)(options, KEEP_EXTENSIONS)) === null ||
          _a === void 0
          ? void 0
          : _a.value,
      ),
      callExpression,
    );
  }
}
function checkMulter(context, callExpression) {
  var _a;
  if (callExpression.arguments.length === 0) {
    return;
  }
  var multerOptions = (0, helpers_1.getValueOfExpression)(
    context,
    callExpression.arguments[0],
    'ObjectExpression',
  );
  if (!multerOptions) {
    return;
  }
  var storagePropertyValue =
    (_a = (0, helpers_1.getObjectExpressionProperty)(multerOptions, STORAGE_OPTION)) === null ||
    _a === void 0
      ? void 0
      : _a.value;
  if (storagePropertyValue) {
    var storageValue = (0, helpers_1.getValueOfExpression)(
      context,
      storagePropertyValue,
      'CallExpression',
    );
    if (storageValue) {
      var diskStorageCallee = getDiskStorageCalleeIfUnsafeStorage(context, storageValue);
      if (diskStorageCallee) {
        report(context, false, false, callExpression, {
          node: diskStorageCallee,
          message: 'no destination specified',
        });
      }
    }
  }
}
function getDiskStorageCalleeIfUnsafeStorage(context, storageCreation) {
  var args = storageCreation.arguments,
    callee = storageCreation.callee;
  if (args.length > 0 && isMemberWithProperty(callee, 'diskStorage')) {
    var storageOptions = (0, helpers_1.getValueOfExpression)(context, args[0], 'ObjectExpression');
    if (
      storageOptions &&
      !(0, helpers_1.getObjectExpressionProperty)(storageOptions, DESTINATION_OPTION)
    ) {
      return callee;
    }
  }
  return false;
}
function isMemberWithProperty(expr, property) {
  return (
    expr.type === 'MemberExpression' &&
    expr.property.type === 'Identifier' &&
    expr.property.name === property
  );
}
function keepExtensionsValue(extensionValue) {
  if (
    extensionValue &&
    extensionValue.type === 'Literal' &&
    typeof extensionValue.value === 'boolean'
  ) {
    return extensionValue.value;
  }
  return false;
}
function visitAssignment(context, assignment) {
  var variableProperty = getVariablePropertyFromAssignment(context, assignment);
  if (!variableProperty) {
    return;
  }
  var objectVariable = variableProperty.objectVariable,
    property = variableProperty.property;
  var formOptions = formidableObjects.get(objectVariable);
  if (formOptions !== undefined) {
    if (property === UPLOAD_DIR) {
      formOptions.uploadDirSet = true;
    }
    if (property === KEEP_EXTENSIONS) {
      formOptions.keepExtensions = keepExtensionsValue(assignment.right);
    }
  }
}
/**
 * for `x.foo = 42` returns 'x' variable and 'foo' property string
 */
function getVariablePropertyFromAssignment(context, assignment) {
  if (assignment.left.type !== 'MemberExpression') {
    return undefined;
  }
  var memberExpr = assignment.left;
  if (memberExpr.object.type === 'Identifier' && memberExpr.property.type === 'Identifier') {
    var objectVariable = (0, helpers_1.getVariableFromName)(context, memberExpr.object.name);
    if (objectVariable) {
      return { objectVariable: objectVariable, property: memberExpr.property.name };
    }
  }
  return undefined;
}
exports.getVariablePropertyFromAssignment = getVariablePropertyFromAssignment;
function report(context, uploadDirSet, keepExtensions, callExpression, secondaryLocation) {
  var message;
  if (keepExtensions && uploadDirSet) {
    message = 'Restrict the extension of uploaded files.';
  } else if (!keepExtensions && !uploadDirSet) {
    message = 'Restrict folder destination of uploaded files.';
  } else if (keepExtensions && !uploadDirSet) {
    message = 'Restrict the extension and folder destination of uploaded files.';
  }
  if (message) {
    if (secondaryLocation) {
      message = (0, helpers_1.toEncodedMessage)(
        message,
        [secondaryLocation.node],
        [secondaryLocation.message],
      );
    } else {
      message = (0, helpers_1.toEncodedMessage)(message, []);
    }
    context.report({
      message: message,
      node: callExpression.callee,
    });
  }
}
