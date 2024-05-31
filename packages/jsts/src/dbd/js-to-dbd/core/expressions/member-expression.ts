import type { Instruction } from '../instruction';
import { TSESTree } from '@typescript-eslint/utils';
import { handleExpression } from './index';
import type { ExpressionHandler } from '../expression-handler';

export const handleMemberExpression: ExpressionHandler<TSESTree.MemberExpression> = (
  node,
  context,
  scopeReference,
) => {
  const instructions: Array<Instruction> = [];

  const { object, property } = node;
  const {
    instructions: objectInstructions,
    scope,
    value: objectValue,
  } = handleExpression(object, context, scopeReference);

  instructions.push(...objectInstructions);

  const { instructions: propertyInstructions, value: propertyValue } = handleExpression(
    property,
    context,
    objectValue,
  );

  instructions.push(...propertyInstructions);

  return {
    instructions,
    scope,
    value: propertyValue,
  };
};
