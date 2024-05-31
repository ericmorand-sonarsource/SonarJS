import type { StatementHandler } from '../statement-handler';
import { TSESTree } from '@typescript-eslint/typescript-estree';
import { createAssignment, createVariable } from '../variable';
import { createFunctionReference } from '../values/function-reference';
import { createCallInstruction } from '../instructions/call-instruction';
import {
  createNewObjectFunctionDefinition,
  createSetFieldFunctionDefinition,
} from '../function-definition';
import { createReference } from '../values/reference';

export const handleFunctionDeclaration: StatementHandler<TSESTree.FunctionDeclarationWithName> = (
  node,
  context,
) => {
  const { id } = node;
  const {
    blockManager,
    scopeManager,
    functionInfo: currentFunctionInfo,
    processFunction,
  } = context;
  const { createValueIdentifier, getCurrentScopeIdentifier } = scopeManager;
  const { getCurrentBlock } = blockManager;
  const { name } = id;

  const scopeReference = createReference(getCurrentScopeIdentifier());

  // a function declaration is a variable declaration and an assignment in the current scope
  // todo: should be in the ***passed*** scope?
  const variable = createVariable(name);
  const currentScope = context.scopeManager.getCurrentScope();

  currentScope.variables.set(variable.name, variable);

  const functionReferenceIdentifier = createValueIdentifier();
  // todo: we may need a common helper
  let functionName;
  if (currentFunctionInfo.definition.name === 'main') {
    functionName = name;
  } else {
    functionName = `${currentFunctionInfo.definition.name}__${functionReferenceIdentifier}`;
  }
  const functionInfo = processFunction(functionName, node.body.body, node.params, node.loc);
  const functionReference = createFunctionReference(functionInfo, functionReferenceIdentifier);

  currentFunctionInfo.functionReferences.push(functionReference);

  // create the function object
  getCurrentBlock().instructions.push(
    createCallInstruction(
      functionReference.identifier,
      null,
      createNewObjectFunctionDefinition(),
      [],
      node.loc,
    ),
  );

  getCurrentBlock().instructions.push(
    createCallInstruction(
      createValueIdentifier(),
      null,
      createSetFieldFunctionDefinition(variable.name),
      [scopeReference, functionReference],
      node.loc,
    ),
  );

  const assignment = createAssignment(functionReference, variable);

  context.scopeManager.getCurrentScope().assignments.set(id.name, assignment);
};
