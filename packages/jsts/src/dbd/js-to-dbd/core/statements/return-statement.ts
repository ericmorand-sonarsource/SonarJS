import { TSESTree } from '@typescript-eslint/utils';
import { createReturnInstruction } from '../instructions/return-instruction';
import { handleExpression } from '../expressions';
import type { StatementHandler } from '../statement-handler';
import { createScopeReference } from '../values/scope-reference';
import { createNull } from '../values/constant';

export const handleReturnStatement: StatementHandler<TSESTree.ReturnStatement> = (
  node,
  context,
) => {
  const { blockManager, scopeManager } = context;
  const { getCurrentBlock } = blockManager;

  if (node.argument === null) {
    getCurrentBlock().instructions.push(createReturnInstruction(createNull(), node.loc));
  } else {
    const scopeReference = createScopeReference(
      scopeManager.getCurrentScope(),
      scopeManager.createValueIdentifier(),
    );

    const value = handleExpression(node.argument, context, scopeReference);
    getCurrentBlock().instructions.push(...value.instructions);
    getCurrentBlock().instructions.push(createReturnInstruction(value.value, node.loc));
  }
};
