import { TSESTree } from '@typescript-eslint/typescript-estree';
import type { StatementHandler } from '../statement-handler';
import type { Instruction } from '../instruction';
import { handleExpression } from '../expressions';
import { createScopeReference } from '../values/scope-reference';

export const handleVariableDeclaration: StatementHandler<TSESTree.VariableDeclaration> = (
  node,
  context,
) => {
  const { blockManager, scopeManager } = context;
  const { getCurrentBlock } = blockManager;
  const instructions: Array<Instruction> = [];

  for (const declaration of node.declarations) {
    const { instructions: declarationInstruction } = handleExpression(
      declaration,
      context,
      createScopeReference(
        scopeManager.getCurrentScope(),
        scopeManager.getCurrentScopeIdentifier(),
      ),
    );

    instructions.push(...declarationInstruction);
  }

  getCurrentBlock().instructions.push(...instructions);
};
