import type { Value } from './value';

export type Assignment = {
  readonly value: Value;
  readonly variable: Variable;
};

export const createAssignment = (value: Value, variable: Variable): Assignment => {
  return {
    value,
    variable,
  };
};

export type Variable = {
  readonly name: string;
  readonly type: string;
  readonly writable: boolean;
};

export const createVariable = (
  name: string,
  type: string | 'unknown' = 'unknown',
  writable: boolean = true,
): Variable => {
  return {
    name,
    type,
    writable,
  };
};
