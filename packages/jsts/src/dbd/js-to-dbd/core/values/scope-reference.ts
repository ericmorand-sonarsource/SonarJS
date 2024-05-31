import { createReference, type Reference } from './reference';
import type { Value } from '../value';
import type { Scope } from '../scope';

export type ScopeReference = Reference & {
  scope: Scope;
};

export const createScopeReference = (scope: Scope, identifier: number): ScopeReference => {
  return {
    ...createReference(identifier),
    scope,
  };
};

export const isAScopeReference = (candidate: Value): candidate is ScopeReference => {
  return (candidate as ScopeReference).scope !== undefined;
};
