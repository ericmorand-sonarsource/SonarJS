import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/typescript-estree';
import { createAssignment, createVariable, type Variable } from './variable';
import {
  createFunctionDefinition,
  createSetFieldFunctionDefinition,
  generateSignature,
} from './function-definition';
import { createReturnInstruction } from './instructions/return-instruction';
import {
  createFunctionInfo,
  createFunctionInfo as _createFunctionInfo,
  type FunctionInfo,
} from './function-info';
import { createScopeDeclarationInstruction, isTerminated } from './utils';
import { handleStatement as _handleStatement } from './statements';
import { createScopeManager } from './scope-manager';
import { createCallInstruction } from './instructions/call-instruction';
import { createBranchingInstruction } from './instructions/branching-instruction';
import { createConstant, createNull } from './values/constant';
import { createReference } from './values/reference';
import { createParameter } from './values/parameter';
import { type Context, createContext } from './context-manager';
import { type BlockManager, createBlockManager } from './block-manager';
import type { Value } from './value';
import type { Block } from './block';

export type Transpiler = (ast: TSESTree.Program, fileName: string) => Array<FunctionInfo>;

export const createTranspiler = (hostDefinedProperties: Array<Variable> = []): Transpiler => {
  return (program, fileName) => {
    const functionInfos: Array<FunctionInfo> = [];

    const location = program.loc;
    const scopeManager = createScopeManager();
    const blockManager = createBlockManager();

    const { createScope, unshiftScope, createValueIdentifier, shiftScope } = scopeManager;
    const { pushBlock, createBlock } = blockManager;

    /**
     *  set up the outer scope
     *  @see https://262.ecma-international.org/14.0/#sec-global-environment-records
     */
    const scope = createScope();
    const block = createBlock(scope, location);

    unshiftScope(scope);
    pushBlock(block);

    // add the scope creation instruction
    block.instructions.push(createScopeDeclarationInstruction(scope, location));

    // globalThis is a reference to the outer scope itself
    block.instructions.push(
      createCallInstruction(
        createValueIdentifier(),
        null,
        createSetFieldFunctionDefinition('globalThis'),
        [createReference(scope.identifier), createReference(scope.identifier)],
        location,
      ),
    );

    // assign global variables to the outer scope and declare them
    const globalVariables: Array<[Variable, Value]> = [
      [createVariable('NaN', 'NaN', false), createNull()],
      [createVariable('Infinity', 'int', false), createNull()],
      [createVariable('undefined', 'Record', false), createNull()],
      ...(hostDefinedProperties.map(property => {
        return [property, createConstant(createValueIdentifier(), property.name)];
      }) as Array<[Variable, Value]>),
    ];

    for (const [globalVariable, value] of globalVariables) {
      const { name } = globalVariable;
      const assignmentIdentifier = createValueIdentifier();
      const assignment = createAssignment(createReference(assignmentIdentifier), globalVariable);

      scope.variables.set(name, globalVariable);
      scope.assignments.set(name, assignment);

      block.instructions.push(
        createCallInstruction(
          assignment.value.identifier,
          null,
          createSetFieldFunctionDefinition(name),
          [createReference(scope.identifier), value],
          program.loc,
        ),
      );
    }

    const createProcessFunction = (
      blockManager: BlockManager,
      outerBlock?: Block,
    ): Context['processFunction'] => {
      return (name, body, parameters, location) => {
        const { pushBlock, createBlock, getCurrentBlock } = blockManager;

        // resolve the function parameters
        const parentScopeName = '@parent';
        const parentReference = createParameter(createValueIdentifier(), parentScopeName, location);

        const functionParameters = [
          parentReference,
          ...parameters.map(parameter => {
            let parameterName: string;

            if (parameter.type === AST_NODE_TYPES.Identifier) {
              parameterName = parameter.name;
            } else {
              // todo
              parameterName = '';
            }

            return createParameter(createValueIdentifier(), parameterName, parameter.loc);
          }),
        ];

        const scope = createScope();
        const block = createBlock(scope, location);

        if (outerBlock) {
          outerBlock.instructions.push(createBranchingInstruction(block, location));
        }

        unshiftScope(scope);
        pushBlock(block);

        // add scope declaration instruction
        block.instructions.push(createScopeDeclarationInstruction(scope, location));

        // add the "set parent" instruction
        block.instructions.push(
          createCallInstruction(
            scopeManager.createValueIdentifier(),
            null,
            createSetFieldFunctionDefinition('@parent'),
            [createReference(scope.identifier), parentReference],
            location,
          ),
        );

        // create the function info
        const functionInfo = createFunctionInfo(
          fileName,
          createFunctionDefinition(name, generateSignature(name, fileName)),
          functionParameters,
        );

        const context = createContext(
          functionInfo,
          blockManager,
          scopeManager,
          createProcessFunction(createBlockManager()),
        );

        const handleStatement = (statement: TSESTree.Statement) => {
          return _handleStatement(statement, context);
        };

        // handle the body statements
        body.forEach(handleStatement);

        const lastBlock = getCurrentBlock();

        if (!isTerminated(lastBlock)) {
          lastBlock.instructions.push(createReturnInstruction(createNull(), location));
        }

        functionInfo.blocks.push(...blockManager.blocks);

        functionInfos.push(functionInfo);

        shiftScope();

        return functionInfo;
      };
    };

    const processFunctionInfo = createProcessFunction(blockManager, block);

    processFunctionInfo('main', program.body, [], program.loc);

    shiftScope();

    return functionInfos;
  };
};
