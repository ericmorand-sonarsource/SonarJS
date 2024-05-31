import { type Assignment, type Variable } from './variable';
import { type Scope, createScope as _createScope } from './scope';
import { Value } from './value';
import { type Constant } from './values/constant';
import { isAScopeReference } from './values/scope-reference';

type ConstantType =
  | 'bigint'
  | 'boolean'
  | 'function'
  | 'null'
  | 'number'
  | 'object'
  | 'RegExp'
  | 'string'
  | 'symbol'
  | 'undefined';

export interface ScopeManager {
  readonly constantRegistry: Map<Constant['value'], Constant>;
  readonly scopeByConstantTypeRegistry: Map<ConstantType, Scope>;

  get scopes(): Array<Scope>;

  createValueIdentifier(): number;

  createScope(): Scope;

  /**
   * Return the nearest assignment to `variable`.
   * todo: maybe remove
   */
  getAssignment(variable: Variable, scopeReference?: Value): Assignment | null;

  getCurrentScope(): Scope;

  getCurrentScopeIdentifier(): number;

  getScopeFromReference(scopeReference: Value): Scope | null;

  /**
   * Return the nearest variable registered under `name`, alongside its owner.
   * todo: maybe remove
   */
  getVariableAndOwner(
    name: string,
    scopeReference?: Value,
  ): {
    variable: Variable;
    owner: Scope;
  } | null;

  unshiftScope(scope: Scope): void;

  shiftScope(): Scope | undefined;
}

export const createScopeManager = (): ScopeManager => {
  const scopes: Array<Scope> = [];
  const scopeRegistry = new Map<number, Scope>();

  let valueIndex = 0;

  const getCurrentScope = () => scopes[0];

  const getVariableAssigner = (variable: Variable): Scope | null => {
    return (
      scopes.find(scope => {
        return scope.assignments.has(variable.name);
      }) || null
    );
  };

  /**
   * @see {ScopeManager.getAssignment}
   */
  const getAssignment: ScopeManager['getAssignment'] = (variable, scopeReference) => {
    const { name } = variable;

    let scope: Scope | null;

    if (scopeReference) {
      scope = getScopeFromReference(scopeReference);
    } else {
      scope = getVariableAssigner(variable);
    }

    return scope?.assignments.get(name) || null;
  };

  const getScopeFromReference: ScopeManager['getScopeFromReference'] = scopeReference => {
    return scopeRegistry.get(scopeReference.identifier) || null;
  };

  /**
   * @see {ScopeManager.getVariableAndOwner}
   */
  const getVariableAndOwner: ScopeManager['getVariableAndOwner'] = (name, scopeReference) => {
    let owner: Scope | null;

    if (scopeReference) {
      if (isAScopeReference(scopeReference)) {
        owner = scopeReference.scope;
      } else {
        owner = getScopeFromReference(scopeReference);
      }
    } else {
      owner =
        scopes.find(scope => {
          return scope.variables.has(name);
        }) || null;
    }

    if (!owner) {
      return null;
    }

    const variable = owner.variables.get(name);

    return variable
      ? {
          variable,
          owner,
        }
      : null;
  };

  const createScope = (): Scope => {
    return _createScope(valueIndex++);
  };

  const scopeByConstantTypeRegistry: Map<ConstantType, Scope> = new Map([]);
  const constantRegistry: ScopeManager['constantRegistry'] = new Map([]);

  return {
    get scopes() {
      return scopes;
    },
    createValueIdentifier: () => {
      return valueIndex++;
    },
    createScope,
    getAssignment,
    getCurrentScope,
    getVariableAndOwner,
    getCurrentScopeIdentifier() {
      return getCurrentScope().identifier;
    },
    getScopeFromReference,
    unshiftScope: scope => {
      scopeRegistry.set(scope.identifier, scope);
      scopes.unshift(scope);
    },
    shiftScope: () => scopes.shift(),
    scopeByConstantTypeRegistry,
    constantRegistry,
  };
};

export class ScopeManagerClass {
  scopes: Scope[] = [];
  valueIndex = 0;

  push = (scope: Scope) => {
    this.scopes.unshift(scope);
    return scope;
  };
  pop = (): Scope | undefined => this.scopes.shift();
  getCurrentScope = () => this.scopes[0];
  createScope = () => {
    return _createScope(this.createValueIdentifier());
  };
  createValueIdentifier = () => {
    const result = this.valueIndex;
    this.valueIndex++;
    return result;
  };

  getVariableAssigner = (variable: Variable): Scope | undefined => {
    return this.scopes.find(scope => {
      return scope.assignments.has(variable.name);
    });
  };

  getVariableAndOwner = (name: string) => {
    const owner = this.scopes.find(scope => {
      return scope.variables.has(name);
    });

    if (!owner) {
      return null;
    }

    const variable = owner.variables.get(name);
    return variable
      ? {
          variable,
          owner,
        }
      : null;
  };

  getAssignment = (variable: Variable): Assignment | null => {
    const { name } = variable;

    const scope = this.getVariableAssigner(variable);

    return scope?.assignments.get(name) || null;
  };
}
