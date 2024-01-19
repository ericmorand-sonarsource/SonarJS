'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.reduceTo =
  exports.reduceToIdentifier =
  exports.getFullyQualifiedNameRaw =
  exports.getFullyQualifiedName =
  exports.getRequireCalls =
  exports.getImportDeclarations =
    void 0;
var ast_1 = require('./ast');
function getImportDeclarations(context) {
  var program = context.sourceCode.ast;
  if (program.sourceType === 'module') {
    return program.body.filter(function (node) {
      return node.type === 'ImportDeclaration';
    });
  }
  return [];
}
exports.getImportDeclarations = getImportDeclarations;
function getRequireCalls(context) {
  var required = [];
  var scopeManager = context.sourceCode.scopeManager;
  scopeManager.scopes.forEach(function (scope) {
    return scope.variables.forEach(function (variable) {
      return variable.defs.forEach(function (def) {
        if (def.type === 'Variable' && def.node.init) {
          if (isRequire(def.node.init)) {
            required.push(def.node.init);
          } else if (def.node.init.type === 'MemberExpression' && isRequire(def.node.init.object)) {
            required.push(def.node.init.object);
          }
        }
      });
    });
  });
  return required;
}
exports.getRequireCalls = getRequireCalls;
function isRequire(node) {
  return (
    node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'require' &&
    node.arguments.length === 1
  );
}
/**
 * Returns 'module' if `node` is a `require('module')` CallExpression
 *
 * For usage inside rules, prefer getFullyQualifiedName()
 *
 * @param node
 * @returns the module name or undefined
 */
function getModuleNameFromRequire(node) {
  if (isRequire(node)) {
    var moduleName = node.arguments[0];
    if (moduleName.type === 'Literal') {
      return moduleName;
    }
  }
  return undefined;
}
/**
 * Returns the fully qualified name of ESLint node
 *
 * This function filters out the `node:` prefix
 *
 * A fully qualified name here denotes a value that is accessed through an imported
 * symbol, e.g., `foo.bar.baz` where `foo` was imported either from a require call
 * or an import statement:
 *
 * ```
 * const foo = require('lib');
 * foo.bar.baz.qux; // matches the fully qualified name 'lib.bar.baz.qux' (not 'foo.bar.baz.qux')
 * const foo2 = require('lib').bar;
 * foo2.baz.qux; // matches the fully qualified name 'lib.bar.baz.qux'
 * ```
 *
 * Returns null when an FQN could not be found.
 *
 * @param context the rule context
 * @param node the node
 * @param fqn the already traversed FQN (for recursive calls)
 * @param scope scope to look for the variable definition, used in recursion not to
 *              loop over same variable always in the lower scope
 */
function getFullyQualifiedName(context, node, fqn, scope) {
  if (fqn === void 0) {
    fqn = [];
  }
  return removeNodePrefixIfExists(getFullyQualifiedNameRaw(context, node, fqn, scope));
}
exports.getFullyQualifiedName = getFullyQualifiedName;
/**
 * Just like getFullyQualifiedName(), but does not filter out the `node:` prefix.
 *
 * To be used for rules that need to work with the `node:` prefix.
 */
function getFullyQualifiedNameRaw(context, node, fqn, scope, visitedVars) {
  if (visitedVars === void 0) {
    visitedVars = [];
  }
  var nodeToCheck = reduceToIdentifier(node, fqn);
  if (!(0, ast_1.isIdentifier)(nodeToCheck)) {
    // require chaining, e.g. `require('lib')()` or `require('lib').prop()`
    if (node.type === 'CallExpression') {
      var qualifiers = [];
      var maybeRequire = reduceTo('CallExpression', node.callee, qualifiers);
      var module_1 = getModuleNameFromRequire(maybeRequire);
      if (
        typeof (module_1 === null || module_1 === void 0 ? void 0 : module_1.value) === 'string'
      ) {
        qualifiers.unshift(module_1.value);
        return qualifiers.join('.');
      }
    }
    return null;
  }
  var variable = (0, ast_1.getVariableFromScope)(
    scope !== null && scope !== void 0 ? scope : context.getScope(),
    nodeToCheck.name,
  );
  if (!variable || variable.defs.length > 1) {
    return null;
  }
  // built-in variable
  // ESLint marks built-in global variables with an undocumented hidden `writeable` property that should equal `false`.
  // @see https://github.com/eslint/eslint/blob/6380c87c563be5dc78ce0ddd5c7409aaf71692bb/lib/linter/linter.js#L207
  // @see https://github.com/eslint/eslint/blob/6380c87c563be5dc78ce0ddd5c7409aaf71692bb/lib/rules/no-global-assign.js#L81
  if (variable.writeable === false || visitedVars.includes(variable)) {
    fqn.unshift(nodeToCheck.name);
    return fqn.join('.');
  }
  var definition = variable.defs.find(function (_a) {
    var type = _a.type;
    return ['ImportBinding', 'Variable'].includes(type);
  });
  if (!definition) {
    return null;
  }
  // imports
  var fqnFromImport = checkFqnFromImport(variable, definition, context, fqn, visitedVars);
  if (fqnFromImport !== null) {
    return fqnFromImport;
  }
  // requires
  var fqnFromRequire = checkFqnFromRequire(variable, definition, context, fqn, visitedVars);
  if (fqnFromRequire !== null) {
    return fqnFromRequire;
  }
  return null;
}
exports.getFullyQualifiedNameRaw = getFullyQualifiedNameRaw;
function checkFqnFromImport(variable, definition, context, fqn, visitedVars) {
  var _a, _b, _c;
  if (definition.type === 'ImportBinding') {
    var specifier = definition.node;
    var importDeclaration = definition.parent;
    // import {default as cdk} from 'aws-cdk-lib';
    // vs.
    // import { aws_s3 as s3 } from 'aws-cdk-lib';
    if (
      specifier.type === 'ImportSpecifier' &&
      ((_a = specifier.imported) === null || _a === void 0 ? void 0 : _a.name) !== 'default'
    ) {
      fqn.unshift((_b = specifier.imported) === null || _b === void 0 ? void 0 : _b.name);
    }
    if (
      typeof ((_c = importDeclaration.source) === null || _c === void 0 ? void 0 : _c.value) ===
      'string'
    ) {
      var importedQualifiers = importDeclaration.source.value.split('/');
      fqn.unshift.apply(fqn, importedQualifiers);
      return fqn.join('.');
    }
    // import s3 = require('aws-cdk-lib/aws-s3');
    if (importDeclaration.type === 'TSImportEqualsDeclaration') {
      var importedModule = importDeclaration.moduleReference;
      if (
        importedModule.type === 'TSExternalModuleReference' &&
        importedModule.expression.type === 'Literal' &&
        typeof importedModule.expression.value === 'string'
      ) {
        var importedQualifiers = importedModule.expression.value.split('/');
        fqn.unshift.apply(fqn, importedQualifiers);
        return fqn.join('.');
      }
      //import s3 = cdk.aws_s3;
      if (importedModule.type === 'TSQualifiedName') {
        visitedVars.push(variable);
        return getFullyQualifiedNameRaw(context, importedModule, fqn, variable.scope, visitedVars);
      }
    }
  }
  return null;
}
function checkFqnFromRequire(variable, definition, context, fqn, visitedVars) {
  var _a;
  var value = (0, ast_1.getUniqueWriteReference)(variable);
  // requires
  if (definition.type === 'Variable' && value) {
    // case for `const {Bucket} = require('aws-cdk-lib/aws-s3');`
    // case for `const {Bucket: foo} = require('aws-cdk-lib/aws-s3');`
    if (definition.node.id.type === 'ObjectPattern') {
      for (var _i = 0, _b = definition.node.id.properties; _i < _b.length; _i++) {
        var property = _b[_i];
        if (property.value === definition.name) {
          fqn.unshift(property.key.name);
        }
      }
    }
    var nodeToCheck = reduceTo('CallExpression', value, fqn);
    var module_2 =
      (_a = getModuleNameFromRequire(nodeToCheck)) === null || _a === void 0 ? void 0 : _a.value;
    if (typeof module_2 === 'string') {
      var importedQualifiers = module_2.split('/');
      fqn.unshift.apply(fqn, importedQualifiers);
      return fqn.join('.');
    } else {
      visitedVars.push(variable);
      return getFullyQualifiedNameRaw(context, nodeToCheck, fqn, variable.scope, visitedVars);
    }
  }
  return null;
}
/**
 * Removes `node:` prefix if such exists
 *
 * Node.js builtin modules can be referenced with a `node:` prefix (eg.: node:fs/promises)
 *
 * https://nodejs.org/api/esm.html#node-imports
 *
 * @param fqn Fully Qualified Name (ex.: `node:https.request`)
 * @returns `fqn` sanitized from `node:` prefix (ex.: `https.request`)
 */
function removeNodePrefixIfExists(fqn) {
  if (fqn === null) {
    return null;
  }
  var NODE_NAMESPACE = 'node:';
  if (fqn.startsWith(NODE_NAMESPACE)) {
    return fqn.substring(NODE_NAMESPACE.length);
  }
  return fqn;
}
/**
 * Helper function for getFullyQualifiedName to handle Member expressions
 * filling in the FQN array with the accessed properties.
 * @param node the Node to traverse
 * @param fqn the array with the qualifiers
 */
function reduceToIdentifier(node, fqn) {
  if (fqn === void 0) {
    fqn = [];
  }
  return reduceTo('Identifier', node, fqn);
}
exports.reduceToIdentifier = reduceToIdentifier;
/**
 * Reduce a given node through its ancestors until a given node type is found
 * filling in the FQN array with the accessed properties.
 * @param type the type of node you are looking for to be returned. Returned node still needs to be
 *             checked as its type it's not guaranteed to match the passed type.
 * @param node the Node to traverse
 * @param fqn the array with the qualifiers
 */
function reduceTo(type, node, fqn) {
  if (fqn === void 0) {
    fqn = [];
  }
  var nodeToCheck = node;
  while (nodeToCheck.type !== type) {
    if (nodeToCheck.type === 'MemberExpression') {
      var property = nodeToCheck.property;
      if (property.type === 'Literal' && typeof property.value === 'string') {
        fqn.unshift(property.value);
      } else if (property.type === 'Identifier') {
        fqn.unshift(property.name);
      }
      nodeToCheck = nodeToCheck.object;
    } else if (nodeToCheck.type === 'CallExpression' && !getModuleNameFromRequire(nodeToCheck)) {
      nodeToCheck = nodeToCheck.callee;
    } else if (nodeToCheck.type === 'NewExpression') {
      nodeToCheck = nodeToCheck.callee;
    } else if (nodeToCheck.type === 'ChainExpression') {
      nodeToCheck = nodeToCheck.expression;
    } else if (nodeToCheck.type === 'TSNonNullExpression') {
      // we should migrate to use only TSESTree types everywhere to avoid casting
      nodeToCheck = nodeToCheck.expression;
    } else if (nodeToCheck.type === 'TSQualifiedName') {
      var qualified = nodeToCheck;
      fqn.unshift(qualified.right.name);
      nodeToCheck = qualified.left;
    } else {
      break;
    }
  }
  return nodeToCheck;
}
exports.reduceTo = reduceTo;
