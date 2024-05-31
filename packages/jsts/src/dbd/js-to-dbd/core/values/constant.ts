import type { TypeInfo } from '../type-info';
import { type BaseValue, createValue } from '../value';
export { createNull } from './reference'; // todo: refactor code and remove

export type Constant = BaseValue<'constant'> & {
  readonly value: bigint | boolean | null | number | RegExp | string | undefined;
  readonly typeInfo: TypeInfo;
};

export const createConstant = (identifier: number, value: Constant['value']): Constant => {
  return {
    ...createValue(identifier, 'constant'),
    typeInfo: {
      kind: 'PRIMITIVE',
      qualifiedName: 'int',
      hasIncompleteSemantics: true,
    },
    value,
  };
};
