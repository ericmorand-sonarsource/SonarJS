import { TSESTree } from '@typescript-eslint/utils';
import { compileAsAssignment, handleExpression } from './index';
import type { ExpressionHandler } from '../expression-handler';
import type { Instruction } from '../instruction';
import { createNull } from '../values/constant';

export const handleAssignmentExpression: ExpressionHandler<TSESTree.AssignmentExpression> = (
  node,
  context,
  scopeReference,
) => {
  const instructions: Array<Instruction> = [];

  const { left, right } = node;

  // rhs
  const { instructions: rightInstructions, value: rightValue } = handleExpression(
    right,
    context,
    scopeReference,
  );

  instructions.push(...rightInstructions);

  // lhs
  const leftInstructions = compileAsAssignment(left, rightValue, context, scopeReference as any);

  instructions.push(...leftInstructions);

  return {
    instructions,
    scope: null,
    value: createNull(),
  };
};
