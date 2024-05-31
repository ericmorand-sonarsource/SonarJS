import { TSESTree } from '@typescript-eslint/utils';
import type { Instruction } from '../instruction';
import { createConstant, createNull } from '../values/constant';
import type { ExpressionHandler } from '../expression-handler';
import { createCallInstruction } from '../instructions/call-instruction';
import { createNewObjectFunctionDefinition } from '../function-definition';

export const handleLiteral: ExpressionHandler<TSESTree.Literal> = (node, context) => {
  const { constantRegistry, createValueIdentifier, scopeByConstantTypeRegistry } =
    context.scopeManager;
  const instructions: Array<Instruction> = [];

  if (node.value === null) {
    return {
      instructions,
      scope: null,
      value: createNull(),
    };
  }

  let constant = constantRegistry.get(node.value);

  if (!constant) {
    constant = createConstant(createValueIdentifier(), node.value);

    constantRegistry.set(node.value, constant);
  }

  let scope = scopeByConstantTypeRegistry.get(typeof constant.value);

  if (!scope) {
    scope = context.scopeManager.createScope();

    scopeByConstantTypeRegistry.set(typeof constant.value, scope);

    instructions.push(
      createCallInstruction(
        scope.identifier,
        null,
        createNewObjectFunctionDefinition(),
        [],
        node.loc,
      ),
    );
  }

  return {
    instructions,
    scope,
    value: constant,
  };
};
