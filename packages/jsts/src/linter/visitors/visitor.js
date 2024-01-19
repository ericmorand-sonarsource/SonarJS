'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.childrenOf = exports.visit = void 0;
/**
 * Visits the abstract syntax tree of an ESLint source code
 * @param sourceCode the source code to visit
 * @param callback a callback function invoked at each node visit
 */
function visit(sourceCode, callback) {
  var stack = [sourceCode.ast];
  while (stack.length) {
    var node = stack.pop();
    callback(node);
    stack.push.apply(stack, childrenOf(node, sourceCode.visitorKeys).reverse());
  }
}
exports.visit = visit;
/**
 * Returns the direct children of a node
 * @param node the node to get the children
 * @param visitorKeys the visitor keys provided by the source code
 * @returns the node children
 */
function childrenOf(node, visitorKeys) {
  var keys = visitorKeys[node.type];
  var children = [];
  if (keys) {
    for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
      var key = keys_1[_i];
      /**
       * A node's child may be a node or an array of nodes, e.g., `body` in `estree.Program`.
       * If it's an array, we extract all the nodes from it; if not, we just add the node.
       */
      var child = node[key];
      if (Array.isArray(child)) {
        children.push.apply(children, child);
      } else {
        children.push(child);
      }
    }
  }
  return children.filter(Boolean);
}
exports.childrenOf = childrenOf;
