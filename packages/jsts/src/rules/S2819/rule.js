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
// https://sonarsource.github.io/rspec/#/rspec/S2819/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var helpers_1 = require('../helpers');
var linter_1 = require('../../linter');
var nodes_1 = require('eslint-plugin-sonarjs/lib/utils/nodes');
var POST_MESSAGE = 'postMessage';
var ADD_EVENT_LISTENER = 'addEventListener';
exports.rule = {
  meta: {
    messages: {
      specifyTarget: 'Specify a target origin for this message.',
      verifyOrigin: 'Verify the origin of the received message.',
    },
  },
  create: function (context) {
    var _a;
    var services = context.sourceCode.parserServices;
    if (!(0, helpers_1.isRequiredParserServices)(services)) {
      return {};
    }
    return (
      (_a = {}),
      (_a[
        'CallExpression:matches([callee.name="'
          .concat(POST_MESSAGE, '"], [callee.property.name="')
          .concat(POST_MESSAGE, '"])')
      ] = function (node) {
        checkPostMessageCall(node, context);
      }),
      (_a['CallExpression[callee.property.name="'.concat(ADD_EVENT_LISTENER, '"]')] = function (
        node,
      ) {
        checkAddEventListenerCall(node, context);
      }),
      _a
    );
  },
};
function isWindowObject(node, context) {
  var type = (0, helpers_1.getTypeAsString)(node, context.sourceCode.parserServices);
  var hasWindowName = WindowNameVisitor.containsWindowName(node, context);
  return type.match(/window/i) || type.match(/globalThis/i) || hasWindowName;
}
function checkPostMessageCall(callExpr, context) {
  var _a;
  var callee = callExpr.callee;
  // Window.postMessage() can take 2 or 3 arguments
  if (
    ![2, 3].includes(callExpr.arguments.length) ||
    ((_a = (0, helpers_1.getValueOfExpression)(context, callExpr.arguments[1], 'Literal')) ===
      null || _a === void 0
      ? void 0
      : _a.value) !== '*'
  ) {
    return;
  }
  if (callee.type === 'Identifier') {
    context.report({
      node: callee,
      messageId: 'specifyTarget',
    });
  }
  if (callee.type !== 'MemberExpression') {
    return;
  }
  if (isWindowObject(callee.object, context)) {
    context.report({
      node: callee,
      messageId: 'specifyTarget',
    });
  }
}
function checkAddEventListenerCall(callExpr, context) {
  var callee = callExpr.callee,
    args = callExpr.arguments;
  if (
    !isWindowObject(callee, context) ||
    args.length < 2 ||
    !isMessageTypeEvent(args[0], context)
  ) {
    return;
  }
  var listener = (0, helpers_1.resolveFunction)(context, args[1]);
  if (
    (listener === null || listener === void 0 ? void 0 : listener.body.type) === 'CallExpression'
  ) {
    listener = (0, helpers_1.resolveFunction)(context, listener.body);
  }
  if (!listener || listener.params.length === 0) {
    return;
  }
  var event = listener.params[0];
  if (event.type !== 'Identifier') {
    return;
  }
  if (!hasVerifiedOrigin(context, listener, event)) {
    context.report({
      node: callee,
      messageId: 'verifyOrigin',
    });
  }
}
/**
 * Checks if event.origin or event.originalEvent.origin is verified
 */
function hasVerifiedOrigin(context, listener, event) {
  var scope = context.sourceCode.scopeManager.acquire(listener);
  var eventVariable =
    scope === null || scope === void 0
      ? void 0
      : scope.variables.find(function (v) {
          return v.name === event.name;
        });
  if (eventVariable) {
    var eventIdentifiers = eventVariable.references.map(function (e) {
      return e.identifier;
    });
    for (var _i = 0, _a = eventVariable.references; _i < _a.length; _i++) {
      var reference = _a[_i];
      var eventRef = reference.identifier;
      if (isEventOriginCompared(eventRef) || isEventOriginalEventCompared(eventRef)) {
        return true;
      }
      // event OR-ed with event.originalEvent
      var unionEvent = findUnionEvent(eventRef, eventIdentifiers);
      if (unionEvent !== null && isReferenceCompared(scope, unionEvent)) {
        return true;
      }
      // event.origin OR-ed with event.originalEvent.origin
      var unionOrigin = findUnionOrigin(eventRef, eventIdentifiers);
      if (unionOrigin !== null && isEventOriginReferenceCompared(scope, unionOrigin)) {
        return true;
      }
    }
  }
  return false;
  /**
   * Looks for unionEvent = event | event.originalEvent
   */
  function findUnionEvent(event, eventIdentifiers) {
    var logicalExpr = event.parent;
    if (
      (logicalExpr === null || logicalExpr === void 0 ? void 0 : logicalExpr.type) !==
      'LogicalExpression'
    ) {
      return null;
    }
    if (
      (logicalExpr.left === event && isEventOriginalEvent(logicalExpr.right, eventIdentifiers)) ||
      (logicalExpr.right === event && isEventOriginalEvent(logicalExpr.left, eventIdentifiers))
    ) {
      return extractVariableDeclaratorIfExists(logicalExpr);
    }
    return null;
  }
  /**
   * looks for unionOrigin = event.origin | event.originalEvent.origin
   */
  function findUnionOrigin(eventRef, eventIdentifiers) {
    var _a;
    var memberExpr = eventRef.parent;
    // looks for event.origin in a LogicalExpr
    if (
      !(
        (memberExpr === null || memberExpr === void 0 ? void 0 : memberExpr.type) ===
          'MemberExpression' &&
        ((_a = memberExpr.parent) === null || _a === void 0 ? void 0 : _a.type) ===
          'LogicalExpression'
      )
    ) {
      return null;
    }
    var logicalExpr = memberExpr.parent;
    if (
      !(
        logicalExpr.left === memberExpr &&
        isEventOriginalEventOrigin(logicalExpr.right, eventIdentifiers)
      ) &&
      !(
        logicalExpr.right === memberExpr &&
        isEventOriginalEventOrigin(logicalExpr.left, eventIdentifiers)
      )
    ) {
      return null;
    }
    return extractVariableDeclaratorIfExists(logicalExpr);
    /**
     * checks if memberExpr is event.originalEvent.origin
     */
    function isEventOriginalEventOrigin(memberExpr, eventIdentifiers) {
      var subMemberExpr = memberExpr.object;
      if (
        (subMemberExpr === null || subMemberExpr === void 0 ? void 0 : subMemberExpr.type) !==
        'MemberExpression'
      ) {
        return false;
      }
      var isOrigin =
        memberExpr.property.type === 'Identifier' && memberExpr.property.name === 'origin';
      return isEventOriginalEvent(subMemberExpr, eventIdentifiers) && isOrigin;
    }
  }
}
/**
 * Looks for an occurence of the provided node in an IfStatement
 */
function isReferenceCompared(scope, identifier) {
  function getGrandParent(node) {
    var _a;
    return (_a = node === null || node === void 0 ? void 0 : node.parent) === null || _a === void 0
      ? void 0
      : _a.parent;
  }
  return checkReference(scope, identifier, getGrandParent);
}
/**
 * checks if a reference of identifier is
 * node.identifier
 */
function isEventOriginReferenceCompared(scope, identifier) {
  function getParent(node) {
    return node === null || node === void 0 ? void 0 : node.parent;
  }
  return checkReference(scope, identifier, getParent);
}
/**
 *
 */
function checkReference(scope, identifier, callback) {
  var identifierVariable =
    scope === null || scope === void 0
      ? void 0
      : scope.variables.find(function (v) {
          return v.name === identifier.name;
        });
  if (!identifierVariable) {
    return false;
  }
  for (var _i = 0, _a = identifierVariable.references; _i < _a.length; _i++) {
    var reference = _a[_i];
    var binaryExpressionCandidate = callback(reference.identifier);
    if (isInIfStatement(binaryExpressionCandidate)) {
      return true;
    }
  }
  return false;
}
/**
 * checks if memberExpr is event.originalEvent
 */
function isEventOriginalEvent(memberExpr, eventIdentifiers) {
  var isEvent =
    memberExpr.object.type === 'Identifier' && eventIdentifiers.includes(memberExpr.object);
  var isOriginalEvent =
    memberExpr.property.type === 'Identifier' && memberExpr.property.name === 'originalEvent';
  return isEvent && isOriginalEvent;
}
/**
 * Extracts the identifier to which the 'node' expression is assigned to
 */
function extractVariableDeclaratorIfExists(node) {
  var _a;
  if (((_a = node.parent) === null || _a === void 0 ? void 0 : _a.type) !== 'VariableDeclarator') {
    return null;
  }
  return node.parent.id;
}
/**
 * Looks for an IfStatement with event.origin
 */
function isEventOriginCompared(event) {
  var memberExpr = findEventOrigin(event);
  return isInIfStatement(memberExpr);
}
/**
 * Looks for an IfStatement with event.originalEvent.origin
 */
function isEventOriginalEventCompared(event) {
  var eventOriginalEvent = findEventOriginalEvent(event);
  if (
    !(eventOriginalEvent === null || eventOriginalEvent === void 0
      ? void 0
      : eventOriginalEvent.parent)
  ) {
    return false;
  }
  if (!isPropertyOrigin(eventOriginalEvent.parent)) {
    return false;
  }
  return isInIfStatement(eventOriginalEvent);
}
/**
 * Returns event.origin MemberExpression, if exists
 */
function findEventOrigin(event) {
  var parent = event.parent;
  if ((parent === null || parent === void 0 ? void 0 : parent.type) !== 'MemberExpression') {
    return null;
  }
  if (isPropertyOrigin(parent)) {
    return parent;
  } else {
    return null;
  }
}
/**
 * Checks if node has a property 'origin'
 */
function isPropertyOrigin(node) {
  return (0, helpers_1.isIdentifier)(node.property, 'origin');
}
/**
 * Returns event.originalEvent MemberExpression, if exists
 */
function findEventOriginalEvent(event) {
  var memberExpr = event.parent;
  if (
    (memberExpr === null || memberExpr === void 0 ? void 0 : memberExpr.type) !== 'MemberExpression'
  ) {
    return null;
  }
  var eventCandidate = memberExpr.object,
    originalEventIdentifierCandidate = memberExpr.property;
  if (
    eventCandidate === event &&
    (0, helpers_1.isIdentifier)(originalEventIdentifierCandidate, 'originalEvent')
  ) {
    return memberExpr;
  }
  return null;
}
/**
 * Checks if the current node is nested in an IfStatement
 */
function isInIfStatement(node) {
  // this checks for 'undefined' and 'null', because node.parent can be 'null'
  if (node == null) {
    return false;
  }
  return (0, helpers_1.findFirstMatchingLocalAncestor)(node, nodes_1.isIfStatement) != null;
}
function isMessageTypeEvent(eventNode, context) {
  var eventValue = (0, helpers_1.getValueOfExpression)(context, eventNode, 'Literal');
  return (
    typeof (eventValue === null || eventValue === void 0 ? void 0 : eventValue.value) ===
      'string' && eventValue.value.toLowerCase() === 'message'
  );
}
var WindowNameVisitor = /** @class */ (function () {
  function WindowNameVisitor() {
    this.hasWindowName = false;
  }
  WindowNameVisitor.containsWindowName = function (node, context) {
    var visitor = new WindowNameVisitor();
    visitor.visit(node, context);
    return visitor.hasWindowName;
  };
  WindowNameVisitor.prototype.visit = function (root, context) {
    var _this = this;
    var visitNode = function (node) {
      if (node.type === 'Identifier' && node.name.match(/window/i)) {
        _this.hasWindowName = true;
      }
      (0, linter_1.childrenOf)(node, context.sourceCode.visitorKeys).forEach(visitNode);
    };
    visitNode(root);
  };
  return WindowNameVisitor;
})();
