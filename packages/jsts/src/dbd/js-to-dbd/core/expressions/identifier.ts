import { createReference } from '../values/reference';
import { TSESTree } from '@typescript-eslint/utils';
import type { ExpressionHandler } from '../expression-handler';
import { createGetFieldFunctionDefinition } from '../function-definition';
import type { Instruction } from '../instruction';
import { createCallInstruction } from '../instructions/call-instruction';
import { getParameter } from '../utils';
import { type Value } from '../value';
import type { Assignment } from '../variable';
import type { Scope } from '../scope';
import { createScopeReference, isAScopeReference } from '../values/scope-reference';
import { createFunctionReference, isAFunctionReference } from '../values/function-reference';

export const handleIdentifier: ExpressionHandler<TSESTree.Identifier> = (
  node,
  context,
  scopeReference,
) => {
  const { name } = node;
  const { functionInfo, scopeManager } = context;
  const { createValueIdentifier, getCurrentScopeIdentifier, getCurrentScope } = scopeManager;
  const currentScope = getCurrentScope();

  const instructions: Array<Instruction> = [];

  let operand: Value | null = null;
  let assignment: Assignment | undefined;
  let scope: Scope | null;

  // an identifier can reference a parameter or the parent scope *only* if the passed scope is the current scope
  if (isAScopeReference(scopeReference)) {
    scope = scopeReference.scope;

    if (scopeReference.scope === currentScope) {
      const parameter = getParameter(functionInfo, node.name);

      if (parameter) {
        return {
          instructions,
          scope,
          value: parameter,
        };
      } else {
        // let's look up the scope stack until we find the symbol...or not
        const { scopes } = scopeManager;

        const distance = scopes.findIndex(scope => {
          return scope.assignments.has(name);
        });

        operand = createReference(getCurrentScopeIdentifier());

        for (let i = 0; i < distance; i++) {
          const value = createReference(createValueIdentifier());

          instructions.push(
            createCallInstruction(
              value.identifier,
              null,
              createGetFieldFunctionDefinition('@parent'),
              [operand],
              node.loc,
            ),
          );

          operand = value;
        }
      }
    }
  } else {
    scope = scopeManager.getScopeFromReference(scopeReference);
  }

  if (scope) {
    assignment = scope.assignments.get(name);
  }

  let value: Value | null = null;

  if (assignment) {
    if (isAScopeReference(assignment.value)) {
      scope = assignment.value.scope;

      value = createScopeReference(scope, createValueIdentifier());
    } else if (isAFunctionReference(assignment.value)) {
      value = createFunctionReference(assignment.value.functionInfo, createValueIdentifier());
    }
  }

  if (value === null) {
    value = createReference(createValueIdentifier());
  }

  instructions.push(
    createCallInstruction(
      value.identifier,
      null,
      createGetFieldFunctionDefinition(name),
      [operand || scopeReference],
      node.loc,
    ),
  );

  return {
    instructions,
    scope,
    value,
  };
};
