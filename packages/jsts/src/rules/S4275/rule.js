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
// https://sonarsource.github.io/rspec/#/rspec/S4275/javascript
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
var parameters_1 = require('../../linter/parameters');
var core_1 = require('../core');
function isAccessorNode(node) {
  return (
    (node === null || node === void 0 ? void 0 : node.type) === 'Property' ||
    (node === null || node === void 0 ? void 0 : node.type) === 'MethodDefinition'
  );
}
// The rule is the merger of a decorated ESLint 'getter-return' with the SonarJS 'no-accessor-field-mismatch'.
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
    var getterReturnListener = getterReturnDecorator.create(context);
    var noAccessorFieldMismatchListener = noAccessorFieldMismatchRule.create(context);
    return (0, helpers_1.mergeRules)(getterReturnListener, noAccessorFieldMismatchListener);
  },
};
// The decorator adds secondary location to ESLint 'getter-return'
// as found in issues raised by SonarJS 'no-accessor-field-mismatch'.
function decorateGetterReturn(rule) {
  return (0, helpers_1.interceptReport)(rule, function (context, descriptor) {
    var props = descriptor;
    var node = props.node,
      messageId = props.messageId;
    // The ESLint reports on functions, so the accessor might be the parent.
    // And if it's an accessor with a matching field, report with secondary location pointing to the field.
    if (node != null && reportWithFieldLocation(context, node.parent)) {
      return;
    }
    // Otherwise convert the message to the Sonar format.
    if (messageId === 'expected') {
      reportWithSonarFormat(context, descriptor, 'Refactor this getter to return a value.');
    } else if (messageId === 'expectedAlways') {
      reportWithSonarFormat(context, descriptor, 'Refactor this getter to always return a value.');
    }
  });
}
var getterReturnDecorator = decorateGetterReturn(core_1.eslintRules['getter-return']);
var noAccessorFieldMismatchRule = {
  create: function (context) {
    var _a;
    // Stack of nested object or class fields
    var currentFieldsStack = [new Map()];
    // Selector of a single property descriptor used in Object.defineProperty() or Reflect.defineProperty()
    var singleDescriptorAccessorSelector = [
      'CallExpression[arguments.1.type=Literal]',
      'ObjectExpression:nth-child(3)',
      'Property[value.type=FunctionExpression][key.name=/^[gs]et$/]',
    ].join(' > ');
    // Selector of multiple property descriptors used in Object.defineProperties() or Object.create()
    var multiDescriptorsAccessorSelector = [
      'CallExpression',
      'ObjectExpression:nth-child(2)',
      'Property:matches([key.type=Identifier], [key.type=Literal])',
      'ObjectExpression',
      'Property[value.type=FunctionExpression][key.name=/^[gs]et$/]',
    ].join(' > ');
    return (
      (_a = {
        // Check Object literal properties or Class method definitions
        'Property,MethodDefinition': function (node) {
          var accessorNode = node;
          var accessorInfo = getObjectOrClassAccessorInfo(accessorNode);
          if (accessorInfo) {
            var fieldMap = currentFieldsStack[currentFieldsStack.length - 1];
            checkAccessorNode(context, accessorNode, fieldMap, accessorInfo);
          }
        },
      }),
      // Check Object.defineProperty() or Reflect.defineProperty()
      (_a[singleDescriptorAccessorSelector] = function (node) {
        var accessorNode = node;
        var accessorInfo = getSingleDescriptorAccessorInfo(accessorNode);
        if (accessorInfo) {
          var fieldMap = getSingleVariableFieldMap(context, accessorInfo.name);
          checkAccessorNode(context, accessorNode, fieldMap, accessorInfo);
        }
      }),
      // Check Object.defineProperties() or Object.create()
      (_a[multiDescriptorsAccessorSelector] = function (node) {
        var accessorNode = node;
        var accessorInfo = getMultiDescriptorsAccessorInfo(accessorNode);
        if (accessorInfo) {
          var fieldMap = getSingleVariableFieldMap(context, accessorInfo.name);
          checkAccessorNode(context, accessorNode, fieldMap, accessorInfo);
        }
      }),
      (_a.ClassBody = function (node) {
        currentFieldsStack.push(getClassBodyFieldMap(node));
      }),
      (_a.ObjectExpression = function (node) {
        currentFieldsStack.push(getObjectExpressionFieldMap(node));
      }),
      (_a[':matches(ClassBody, ObjectExpression):exit'] = function () {
        currentFieldsStack.pop();
      }),
      _a
    );
  },
};
function checkAccessorNode(context, node, fieldMap, info) {
  var accessor = getAccessor(node, fieldMap, info);
  if (accessor == null || isReportedByGetterReturnDecorator(accessor)) {
    return;
  }
  if (!isUsingAccessorFieldInBody(accessor)) {
    reportWithSecondaryLocation(context, accessor);
  }
}
// ESLint 'getter-return' reports for empty getters
// or empty property descriptor get functions.
function isReportedByGetterReturnDecorator(accessor) {
  var info = accessor.info;
  var emptyGetter = info.type === 'getter' && accessor.statement == null;
  return emptyGetter && (info.definition === 'descriptor' || accessor.node.kind === 'get');
}
function reportWithFieldLocation(context, node) {
  if (!node || !isAccessorNode(node)) {
    return false;
  }
  var info = getNodeAccessorInfo(node);
  if (!info) {
    return false;
  }
  var fieldMap = getNodeFieldMap(context, node.parent, info);
  var accessor = getAccessor(node, fieldMap, info);
  if (!accessor) {
    return false;
  }
  reportWithSecondaryLocation(context, accessor);
  return true;
}
function reportWithSonarFormat(context, descriptor, message) {
  context.report(
    __assign(__assign({}, descriptor), {
      messageId: undefined,
      message: (0, helpers_1.toEncodedMessage)(message),
    }),
  );
}
function reportWithSecondaryLocation(context, accessor) {
  var fieldToRefer = accessor.matchingFields[0];
  var ref = accessor.info.definition === 'descriptor' ? 'variable' : 'property';
  var primaryMessage =
    'Refactor this '.concat(accessor.info.type, ' ') +
    'so that it actually refers to the '.concat(ref, " '").concat(fieldToRefer.name, "'.");
  var secondaryLocations = [fieldToRefer.node];
  var secondaryMessages = [
    ''.concat(ref[0].toUpperCase()).concat(ref.slice(1), ' which should be referred.'),
  ];
  context.report({
    message: (0, helpers_1.toEncodedMessage)(primaryMessage, secondaryLocations, secondaryMessages),
    loc: accessor.node.key.loc,
  });
}
function isPropertyDefinitionCall(call) {
  var objects = ['Object', 'Reflect'];
  var method = 'defineProperty';
  var minArgs = 3;
  return (
    call &&
    objects.some(function (object) {
      return (0, helpers_1.isMethodInvocation)(call, object, method, minArgs);
    })
  );
}
function isPropertiesDefinitionCall(call) {
  var object = 'Object';
  var methods = ['defineProperties', 'create'];
  var minArgs = 2;
  return (
    call &&
    methods.some(function (methodName) {
      return (0, helpers_1.isMethodInvocation)(call, object, methodName, minArgs);
    })
  );
}
function getAccessor(accessor, fieldMap, info) {
  var accessorIsPublic =
    accessor.type !== 'MethodDefinition' ||
    accessor.accessibility == null ||
    accessor.accessibility === 'public';
  var statements = getFunctionBody(accessor.value);
  if (!fieldMap || !accessorIsPublic || !statements || statements.length > 1) {
    return null;
  }
  var matchingFields = findMatchingFields(fieldMap, info.name);
  if (matchingFields.length === 0) {
    return null;
  }
  return {
    statement: statements.length === 0 ? null : statements[0],
    info: info,
    matchingFields: matchingFields,
    node: accessor,
  };
}
function getNodeAccessorInfo(accessorNode) {
  var _a, _b;
  if (accessorNode.type === 'MethodDefinition') {
    return getObjectOrClassAccessorInfo(accessorNode);
  } else {
    return (_b =
      (_a = getMultiDescriptorsAccessorInfo(accessorNode)) !== null && _a !== void 0
        ? _a
        : getSingleDescriptorAccessorInfo(accessorNode)) !== null && _b !== void 0
      ? _b
      : getObjectOrClassAccessorInfo(accessorNode);
  }
}
function getSingleDescriptorAccessorInfo(accessorNode) {
  var callNode = findParentCallExpression(accessorNode);
  var propertyNode = callNode === null || callNode === void 0 ? void 0 : callNode.arguments[1];
  if (
    !isPropertyDefinitionCall(callNode) ||
    !propertyNode ||
    !(0, helpers_1.isStringLiteral)(propertyNode)
  ) {
    return null;
  }
  return getDescriptorAccessorInfo(String(propertyNode.value), accessorNode);
}
function getMultiDescriptorsAccessorInfo(accessorNode) {
  var _a;
  var callNode = findParentCallExpression(accessorNode);
  var propertyNode = (_a = accessorNode.parent) === null || _a === void 0 ? void 0 : _a.parent;
  if (
    !isPropertiesDefinitionCall(callNode) ||
    (propertyNode === null || propertyNode === void 0 ? void 0 : propertyNode.type) !== 'Property'
  ) {
    return null;
  }
  var propertyName = getName(propertyNode.key);
  if (!propertyName) {
    return null;
  }
  return getDescriptorAccessorInfo(propertyName, accessorNode);
}
function getDescriptorAccessorInfo(name, accessor) {
  var key = getName(accessor.key);
  if (key == null) {
    return null;
  } else {
    // Name is not set to lower-case as we can't search variables in a case-insensitive way.
    return {
      type: key === 'get' ? 'getter' : 'setter',
      name: name,
      definition: 'descriptor',
      refResolver: getIdentifierName,
    };
  }
}
function getObjectOrClassAccessorInfo(accessor) {
  var name = getName(accessor.key);
  if (!name) {
    return null;
  }
  name = name.toLowerCase();
  var type = null;
  if (accessor.kind === 'get') {
    type = 'getter';
  } else if (accessor.kind === 'set') {
    type = 'setter';
  } else if (accessor.value.type === 'FunctionExpression') {
    var offset = 3;
    var params = accessor.value.params;
    if (name.startsWith('set') && name.length > offset && params.length === 1) {
      type = 'setter';
      name = name.substring(offset);
    } else if (name.startsWith('get') && name.length > offset && params.length === 0) {
      type = 'getter';
      name = name.substring(offset);
    }
  }
  if (type == null) {
    return null;
  }
  return {
    type: type,
    name: name,
    definition: accessor.type === 'Property' ? 'object' : 'class',
    refResolver: getPropertyName,
  };
}
function findParentCallExpression(node) {
  var _a, _b;
  var parent = (_a = node.parent) === null || _a === void 0 ? void 0 : _a.parent;
  var candidates = [
    parent,
    (_b = parent === null || parent === void 0 ? void 0 : parent.parent) === null || _b === void 0
      ? void 0
      : _b.parent,
  ];
  return candidates.find(function (node) {
    return (node === null || node === void 0 ? void 0 : node.type) === 'CallExpression';
  });
}
function getName(key) {
  if (key.type === 'Literal') {
    return String(key.value);
  } else if (key.type === 'Identifier' || key.type === 'PrivateIdentifier') {
    return key.name;
  }
  return null;
}
function getNodeFieldMap(context, node, info) {
  if (info.definition === 'descriptor') {
    return getSingleVariableFieldMap(context, info.name);
  } else if ((node === null || node === void 0 ? void 0 : node.type) === 'ObjectExpression') {
    return getObjectExpressionFieldMap(node);
  } else if ((node === null || node === void 0 ? void 0 : node.type) === 'ClassBody') {
    return getClassBodyFieldMap(node);
  } else {
    return null;
  }
}
function getSingleVariableFieldMap(context, name) {
  var fieldMap = new Map();
  for (var _i = 0, _a = [name, '_'.concat(name), ''.concat(name, '_')]; _i < _a.length; _i++) {
    var candidate = _a[_i];
    var variable = (0, helpers_1.getVariableFromName)(context, candidate);
    if (variable != null && variable.defs.length > 0) {
      fieldMap.set(candidate, { name: candidate, node: variable.defs[0].node });
      break;
    }
  }
  return fieldMap;
}
function getObjectExpressionFieldMap(node) {
  return getFieldMap(node.properties, function (prop) {
    return isValidObjectField(prop) ? prop.key : null;
  });
}
function getClassBodyFieldMap(classBody) {
  var fields = getFieldMap(classBody.body, function (classElement) {
    return (classElement.type === 'PropertyDefinition' ||
      classElement.type === 'TSAbstractPropertyDefinition') &&
      !classElement.static
      ? classElement.key
      : null;
  });
  var fieldsFromConstructor = fieldsDeclaredInConstructorParameters(classBody);
  return new Map(__spreadArray(__spreadArray([], fields, true), fieldsFromConstructor, true));
}
function getFieldMap(elements, getPropertyName) {
  var fields = new Map();
  for (var _i = 0, elements_1 = elements; _i < elements_1.length; _i++) {
    var element = elements_1[_i];
    var propertyNameNode = getPropertyName(element);
    if (propertyNameNode) {
      var name_1 = getName(propertyNameNode);
      if (name_1) {
        fields.set(name_1.toLowerCase(), {
          name: name_1,
          node: element,
        });
      }
    }
  }
  return fields;
}
function isValidObjectField(prop) {
  return prop.type === 'Property' && !prop.method && prop.kind === 'init';
}
function fieldsDeclaredInConstructorParameters(containingClass) {
  var fieldsFromConstructor = new Map();
  var constr = getConstructorOf(containingClass);
  if (!constr) {
    return fieldsFromConstructor;
  }
  for (var _i = 0, _a = constr.params; _i < _a.length; _i++) {
    var parameter = _a[_i];
    if (
      parameter.type === 'TSParameterProperty' &&
      (parameter.accessibility || parameter.readonly)
    ) {
      var parameterName = getName(parameter.parameter);
      if (parameterName) {
        fieldsFromConstructor.set(parameterName, {
          name: parameterName,
          node: parameter,
        });
      }
    }
  }
  return fieldsFromConstructor;
}
function getConstructorOf(containingClass) {
  for (var _i = 0, _a = containingClass.body; _i < _a.length; _i++) {
    var classElement = _a[_i];
    if (classElement.type === 'MethodDefinition' && getName(classElement.key) === 'constructor') {
      return classElement.value;
    }
  }
}
function findMatchingFields(currentFields, name) {
  var underscoredTargetName1 = '_'.concat(name);
  var underscoredTargetName2 = ''.concat(name, '_');
  var exactFieldName = currentFields.get(name);
  var underscoreFieldName1 = currentFields.get(underscoredTargetName1);
  var underscoreFieldName2 = currentFields.get(underscoredTargetName2);
  return [exactFieldName, underscoreFieldName1, underscoreFieldName2].filter(function (field) {
    return field;
  });
}
function getFunctionBody(node) {
  if (node.type !== 'FunctionExpression' || !node.body) {
    return null;
  }
  return node.body.body;
}
function getPropertyName(expression) {
  if (
    expression &&
    expression.type === 'MemberExpression' &&
    expression.object.type === 'ThisExpression'
  ) {
    return getName(expression.property);
  }
  return null;
}
function getIdentifierName(expression) {
  return (expression === null || expression === void 0 ? void 0 : expression.type) === 'Identifier'
    ? expression.name
    : null;
}
function getFieldUsedInsideSimpleBody(statement, accessorInfo) {
  if (accessorInfo.type === 'setter') {
    if (
      statement.type === 'ExpressionStatement' &&
      statement.expression.type === 'AssignmentExpression'
    ) {
      return accessorInfo.refResolver(statement.expression.left);
    }
  } else if (statement.type === 'ReturnStatement') {
    return accessorInfo.refResolver(statement.argument);
  }
  return null;
}
function isUsingAccessorFieldInBody(accessor) {
  if (accessor.statement == null) {
    return false;
  }
  var usedField = getFieldUsedInsideSimpleBody(accessor.statement, accessor.info);
  if (!usedField) {
    return true;
  }
  return accessor.matchingFields.some(function (matchingField) {
    return usedField === matchingField.name;
  });
}
