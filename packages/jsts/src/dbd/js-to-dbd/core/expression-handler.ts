import { TSESTree } from '@typescript-eslint/utils';
import type { Instruction } from './instruction';
import type { Context } from './context-manager';
import type { Value } from './value';
import type { Scope } from './scope';

export type ExpressionHandlerResult = {
  readonly instructions: Array<Instruction>;
  readonly scope: Scope | null;
  readonly value: Value; // todo: | null?
};

export type ExpressionHandler<
  Expression extends Exclude<TSESTree.Node, TSESTree.Statement> = Exclude<
    TSESTree.Node,
    TSESTree.Statement
  >,
> = (node: Expression, context: Context, scopeReference: Value) => ExpressionHandlerResult;
