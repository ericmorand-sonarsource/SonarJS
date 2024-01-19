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
// https://sonarsource.github.io/rspec/#/rspec/S5693/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var rule_1 = require('../S2598/rule');
var bytes_1 = require('bytes');
var helpers_1 = require('../helpers');
var FORMIDABLE_MODULE = 'formidable';
var MAX_FILE_SIZE = 'maxFileSize';
var FORMIDABLE_DEFAULT_SIZE = 200 * 1024 * 1024;
var MULTER_MODULE = 'multer';
var LIMITS_OPTION = 'limits';
var FILE_SIZE_OPTION = 'fileSize';
var BODY_PARSER_MODULE = 'body-parser';
var BODY_PARSER_DEFAULT_SIZE = (0, bytes_1.parse)('100kb');
var formidableObjects = new Map();
exports.rule = {
  meta: {
    messages: {
      safeLimit: 'Make sure the content length limit is safe here.',
    },
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
          return report(context, value.nodeToReport, value.maxFileSize);
        });
      },
    };
  },
};
function checkCallExpression(context, callExpression) {
  var callee = callExpression.callee;
  var identifierFromModule;
  if (callee.type === 'MemberExpression' && callee.object.type === 'Identifier') {
    identifierFromModule = callee.object;
  } else if (callee.type === 'Identifier') {
    identifierFromModule = callee;
  } else {
    return;
  }
  var fqn = (0, helpers_1.getFullyQualifiedName)(context, identifierFromModule);
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
  if (moduleName === BODY_PARSER_MODULE) {
    checkBodyParser(context, callExpression);
  }
}
function checkFormidable(context, callExpression) {
  if (callExpression.arguments.length === 0) {
    // options will be set later through member assignment
    var formVariable = (0, helpers_1.getLhsVariable)(context);
    if (formVariable) {
      formidableObjects.set(formVariable, {
        maxFileSize: FORMIDABLE_DEFAULT_SIZE,
        nodeToReport: callExpression,
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
    var property = (0, helpers_1.getObjectExpressionProperty)(options, MAX_FILE_SIZE);
    checkSize(context, callExpression, property, FORMIDABLE_DEFAULT_SIZE);
  }
}
function checkMulter(context, callExpression) {
  var _a;
  if (callExpression.arguments.length === 0) {
    report(context, callExpression.callee);
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
  var limitsPropertyValue =
    (_a = (0, helpers_1.getObjectExpressionProperty)(multerOptions, LIMITS_OPTION)) === null ||
    _a === void 0
      ? void 0
      : _a.value;
  if (limitsPropertyValue && limitsPropertyValue.type === 'ObjectExpression') {
    var fileSizeProperty = (0, helpers_1.getObjectExpressionProperty)(
      limitsPropertyValue,
      FILE_SIZE_OPTION,
    );
    checkSize(context, callExpression, fileSizeProperty);
  }
  if (!limitsPropertyValue) {
    report(context, callExpression.callee);
  }
}
function checkBodyParser(context, callExpression) {
  if (callExpression.arguments.length === 0) {
    checkSize(context, callExpression, undefined, BODY_PARSER_DEFAULT_SIZE, true);
    return;
  }
  var options = (0, helpers_1.getValueOfExpression)(
    context,
    callExpression.arguments[0],
    'ObjectExpression',
  );
  if (!options) {
    return;
  }
  var limitsProperty = (0, helpers_1.getObjectExpressionProperty)(options, LIMITS_OPTION);
  checkSize(context, callExpression, limitsProperty, BODY_PARSER_DEFAULT_SIZE, true);
}
function checkSize(context, callExpr, property, defaultLimit, useStandardSizeLimit) {
  if (useStandardSizeLimit === void 0) {
    useStandardSizeLimit = false;
  }
  if (property) {
    var maxFileSizeValue = getSizeValue(context, property.value);
    if (maxFileSizeValue) {
      report(context, property, maxFileSizeValue, useStandardSizeLimit);
    }
  } else {
    report(context, callExpr, defaultLimit, useStandardSizeLimit);
  }
}
function visitAssignment(context, assignment) {
  var variableProperty = (0, rule_1.getVariablePropertyFromAssignment)(context, assignment);
  if (!variableProperty) {
    return;
  }
  var objectVariable = variableProperty.objectVariable,
    property = variableProperty.property;
  var formOptions = formidableObjects.get(objectVariable);
  if (formOptions && property === MAX_FILE_SIZE) {
    var rhsValue = getSizeValue(context, assignment.right);
    if (rhsValue !== undefined) {
      formOptions.maxFileSize = rhsValue;
      formOptions.nodeToReport = assignment;
    } else {
      formidableObjects.delete(objectVariable);
    }
  }
}
function getSizeValue(context, node) {
  var literal = (0, helpers_1.getValueOfExpression)(context, node, 'Literal');
  if (literal) {
    if (typeof literal.value === 'number') {
      return literal.value;
    } else if (typeof literal.value === 'string') {
      return (0, bytes_1.parse)(literal.value);
    }
  }
  return undefined;
}
function report(context, nodeToReport, size, useStandardSizeLimit) {
  if (useStandardSizeLimit === void 0) {
    useStandardSizeLimit = false;
  }
  var _a = context.options,
    fileUploadSizeLimit = _a[0],
    standardSizeLimit = _a[1];
  var limitToCompare = useStandardSizeLimit ? standardSizeLimit : fileUploadSizeLimit;
  if (!size || size > limitToCompare) {
    context.report({
      messageId: 'safeLimit',
      node: nodeToReport,
    });
  }
}
