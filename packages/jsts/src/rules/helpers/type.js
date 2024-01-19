'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.isTypeAlias =
  exports.isBigIntArray =
  exports.isNumberArray =
  exports.isStringArray =
  exports.isArrayLikeType =
  exports.getSignatureFromCallee =
  exports.getSymbolAtLocation =
  exports.getTypeAsString =
  exports.getTypeFromTreeNode =
  exports.isGenericType =
  exports.isAny =
  exports.isThenable =
  exports.isUndefinedOrNull =
  exports.getUnionTypes =
  exports.isUnion =
  exports.isFunction =
  exports.isStringType =
  exports.isNumberType =
  exports.isBigIntType =
  exports.isNumber =
  exports.isString =
  exports.isTypedArray =
  exports.TYPED_ARRAY_TYPES =
  exports.UTILITY_TYPES =
  exports.isArray =
    void 0;
var typescript_1 = __importDefault(require('typescript'));
var ast_1 = require('./ast');
function isArray(node, services) {
  var _a;
  var type = getTypeFromTreeNode(node, services);
  return ((_a = type.symbol) === null || _a === void 0 ? void 0 : _a.name) === 'Array';
}
exports.isArray = isArray;
/**
 * TypeScript provides a set of utility types to facilitate type transformations.
 * @see https://www.typescriptlang.org/docs/handbook/utility-types.html
 */
exports.UTILITY_TYPES = new Set([
  'Awaited',
  'Partial',
  'Required',
  'Readonly',
  'Record',
  'Pick',
  'Omit',
  'Exclude',
  'Extract',
  'NonNullable',
  'Parameters',
  'ConstructorParameters',
  'ReturnType',
  'InstanceType',
  'ThisParameterType',
  'OmitThisParameter',
  'ThisType',
  'Uppercase',
  'Lowercase',
  'Capitalize',
  'Uncapitalize',
]);
/**
 * JavaScript typed arrays
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Typed_arrays
 */
exports.TYPED_ARRAY_TYPES = [
  'Int8Array',
  'Uint8Array',
  'Uint8ClampedArray',
  'Int16Array',
  'Uint16Array',
  'Int32Array',
  'Uint32Array',
  'Float32Array',
  'Float64Array',
  'BigInt64Array',
  'BigUint64Array',
];
/**
 * Checks if the provided node is a JS typed array like "BigInt64Array". See TYPED_ARRAY_TYPES
 *
 * @param node
 * @param services
 * @returns
 */
function isTypedArray(node, services) {
  var _a;
  var type = getTypeFromTreeNode(node, services);
  return exports.TYPED_ARRAY_TYPES.includes(
    (_a = type.symbol) === null || _a === void 0 ? void 0 : _a.name,
  );
}
exports.isTypedArray = isTypedArray;
function isString(node, services) {
  var checker = services.program.getTypeChecker();
  var typ = checker.getTypeAtLocation(services.esTreeNodeToTSNodeMap.get(node));
  return (typ.getFlags() & typescript_1.default.TypeFlags.StringLike) !== 0;
}
exports.isString = isString;
function isNumber(node, services) {
  var checker = services.program.getTypeChecker();
  var typ = checker.getTypeAtLocation(services.esTreeNodeToTSNodeMap.get(node));
  return (typ.getFlags() & typescript_1.default.TypeFlags.NumberLike) !== 0;
}
exports.isNumber = isNumber;
function isBigIntType(type) {
  return (type.getFlags() & typescript_1.default.TypeFlags.BigIntLike) !== 0;
}
exports.isBigIntType = isBigIntType;
function isNumberType(type) {
  return (type.getFlags() & typescript_1.default.TypeFlags.NumberLike) !== 0;
}
exports.isNumberType = isNumberType;
function isStringType(type) {
  var _a;
  return (
    (type.flags & typescript_1.default.TypeFlags.StringLike) > 0 ||
    ((_a = type.symbol) === null || _a === void 0 ? void 0 : _a.name) === 'String'
  );
}
exports.isStringType = isStringType;
function isFunction(node, services) {
  var checker = services.program.getTypeChecker();
  var type = checker.getTypeAtLocation(services.esTreeNodeToTSNodeMap.get(node));
  return type.symbol && (type.symbol.flags & typescript_1.default.SymbolFlags.Function) !== 0;
}
exports.isFunction = isFunction;
function isUnion(node, services) {
  var checker = services.program.getTypeChecker();
  var type = checker.getTypeAtLocation(services.esTreeNodeToTSNodeMap.get(node));
  return type.isUnion();
}
exports.isUnion = isUnion;
/**
 * Returns an array of the union types if the provided type is a union.
 * Otherwise, returns an array containing the provided type as its unique element.
 * @param type A TypeScript type.
 * @return An array of types. It's never empty.
 */
function getUnionTypes(type) {
  return type.isUnion() ? type.types : [type];
}
exports.getUnionTypes = getUnionTypes;
function isUndefinedOrNull(node, services) {
  var checker = services.program.getTypeChecker();
  var typ = checker.getTypeAtLocation(services.esTreeNodeToTSNodeMap.get(node));
  return (
    (typ.getFlags() & typescript_1.default.TypeFlags.Undefined) !== 0 ||
    (typ.getFlags() & typescript_1.default.TypeFlags.Null) !== 0
  );
}
exports.isUndefinedOrNull = isUndefinedOrNull;
function isThenable(node, services) {
  var mapped = services.esTreeNodeToTSNodeMap.get(node);
  var tp = services.program.getTypeChecker().getTypeAtLocation(mapped);
  var thenProperty = tp.getProperty('then');
  return Boolean(thenProperty && thenProperty.flags & typescript_1.default.SymbolFlags.Method);
}
exports.isThenable = isThenable;
function isAny(type) {
  return type.flags === typescript_1.default.TypeFlags.Any;
}
exports.isAny = isAny;
/**
 * Checks if a node has a generic type like:
 *
 * function foo<T> (bar: T) {
 *    bar // is generic
 * }
 *
 * @param node TSESTree.Node
 * @param services RuleContext.parserServices
 * @returns
 */
function isGenericType(node, services) {
  var type = getTypeFromTreeNode(node, services);
  return type.isTypeParameter();
}
exports.isGenericType = isGenericType;
function getTypeFromTreeNode(node, services) {
  var checker = services.program.getTypeChecker();
  return checker.getTypeAtLocation(services.esTreeNodeToTSNodeMap.get(node));
}
exports.getTypeFromTreeNode = getTypeFromTreeNode;
function getTypeAsString(node, services) {
  var _a = services.program.getTypeChecker(),
    typeToString = _a.typeToString,
    getBaseTypeOfLiteralType = _a.getBaseTypeOfLiteralType;
  return typeToString(getBaseTypeOfLiteralType(getTypeFromTreeNode(node, services)));
}
exports.getTypeAsString = getTypeAsString;
function getSymbolAtLocation(node, services) {
  var checker = services.program.getTypeChecker();
  return checker.getSymbolAtLocation(services.esTreeNodeToTSNodeMap.get(node));
}
exports.getSymbolAtLocation = getSymbolAtLocation;
function getSignatureFromCallee(node, services) {
  var checker = services.program.getTypeChecker();
  return checker.getResolvedSignature(services.esTreeNodeToTSNodeMap.get(node));
}
exports.getSignatureFromCallee = getSignatureFromCallee;
/**
 * This function checks if a type may correspond to an array type. Beyond simple array types, it will also
 * consider the union of array types and generic types extending an array type.
 * @param type A type to check
 * @param services The services used to get access to the TypeScript type checker
 */
function isArrayLikeType(type, services) {
  var checker = services.program.getTypeChecker();
  var constrained = checker.getBaseConstraintOfType(type);
  return isArrayOrUnionOfArrayType(
    constrained !== null && constrained !== void 0 ? constrained : type,
    services,
  );
}
exports.isArrayLikeType = isArrayLikeType;
function isArrayOrUnionOfArrayType(type, services) {
  for (var _i = 0, _a = getUnionTypes(type); _i < _a.length; _i++) {
    var part = _a[_i];
    if (!isArrayType(part, services)) {
      return false;
    }
  }
  return true;
}
/**
 * Test if the provided type is an array of strings.
 * @param type A TypeScript type.
 * @param services The services used to get access to the TypeScript type checker
 */
function isStringArray(type, services) {
  return isArrayElementTypeMatching(type, services, isStringType);
}
exports.isStringArray = isStringArray;
/**
 * Test if the provided type is an array of numbers.
 * @param type A TypeScript type.
 * @param services The services used to get access to the TypeScript type checker
 */
function isNumberArray(type, services) {
  return isArrayElementTypeMatching(type, services, isNumberType);
}
exports.isNumberArray = isNumberArray;
/**
 * Test if the provided type is an array of big integers.
 * @param type A TypeScript type.
 * @param services The services used to get access to the TypeScript type checker
 */
function isBigIntArray(type, services) {
  return isArrayElementTypeMatching(type, services, isBigIntType);
}
exports.isBigIntArray = isBigIntArray;
function isArrayElementTypeMatching(type, services, predicate) {
  var checker = services.program.getTypeChecker();
  if (!isArrayType(type, services)) {
    return false;
  }
  var elementType = checker.getTypeArguments(type)[0];
  return elementType && predicate(elementType);
}
// Internal TS API
function isArrayType(type, services) {
  var checker = services.program.getTypeChecker();
  return (
    'isArrayType' in checker &&
    typeof checker.isArrayType === 'function' &&
    checker.isArrayType(type)
  );
}
/**
 * Checks whether a TypeScript type node denotes a type alias.
 * @param node a type node to check
 * @param context the rule context
 */
function isTypeAlias(node, context) {
  if (
    node.type !== 'TSTypeReference' ||
    node.typeName.type !== 'Identifier' ||
    node.typeArguments
  ) {
    return false;
  }
  var scope = context.getScope();
  var variable = (0, ast_1.getVariableFromScope)(scope, node.typeName.name);
  return variable === null || variable === void 0
    ? void 0
    : variable.defs.some(function (def) {
        return def.node.type === 'TSTypeAliasDeclaration';
      });
}
exports.isTypeAlias = isTypeAlias;
