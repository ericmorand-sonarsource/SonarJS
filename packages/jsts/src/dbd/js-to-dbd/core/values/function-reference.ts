import type { FunctionInfo } from '../function-info';
import { createReference, type Reference } from './reference';
import type { Value } from '../value';

export type FunctionReference = Reference & {
  functionInfo: FunctionInfo;
};

export const createFunctionReference = (
  functionInfo: FunctionInfo,
  identifier: number,
): FunctionReference => {
  return {
    ...createReference(identifier),
    functionInfo,
  };
};

export const isAFunctionReference = (candidate: Value): candidate is FunctionReference => {
  return (candidate as FunctionReference).functionInfo !== undefined;
};
