/*
 * SonarQube JavaScript Plugin
 * Copyright (C) 2011-2024 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
import { TSESTree } from '@typescript-eslint/utils';
import { handleExpression } from './index';
import type { Instruction } from '../instruction';
import { createCallInstruction } from '../instructions/call-instruction';
import { Value } from '../value';
import { createReference } from '../values/reference';
import type { ExpressionHandler } from '../expression-handler';
import { AST_NODE_TYPES } from '@typescript-eslint/typescript-estree';
import { getParameter } from '../utils';
import { createNull } from '../values/constant';
import { isAFunctionReference } from '../values/function-reference';

export const handleCallExpression: ExpressionHandler<TSESTree.CallExpression> = (
  node,
  context,
  scopeReference,
) => {
  const { functionInfo, scopeManager } = context;

  const { createValueIdentifier, getVariableAndOwner, getAssignment, getCurrentScopeIdentifier } =
    scopeManager;
  const instructions: Array<Instruction> = [];

  let value: Value;

  const { callee, arguments: argumentExpressions } = node;

  const argumentValues: Array<Value> = [];

  for (const argumentExpression of argumentExpressions) {
    if (argumentExpression.type === AST_NODE_TYPES.Identifier) {
      const parameter = getParameter(functionInfo, argumentExpression.name);

      if (parameter) {
        argumentValues.push(parameter);
      } else {
        // if not it may be a variable of the scope
        const variableAndOwner = getVariableAndOwner(argumentExpression.name, scopeReference);

        if (variableAndOwner) {
          const assignment = getAssignment(variableAndOwner.variable, scopeReference);

          if (assignment) {
            argumentValues.push(createReference(assignment.value.identifier));
          }
        }

        // todo
      }
    } else {
      const compilationResult = handleExpression(argumentExpression, context, scopeReference);

      argumentValues.push(compilationResult.value);

      instructions.push(...compilationResult.instructions);
    }
  }

  const { instructions: calleeInstructions, value: calleeValue } = handleExpression(
    callee,
    context,
    scopeReference,
  );

  instructions.push(...calleeInstructions);

  if (isAFunctionReference(calleeValue)) {
    const { functionInfo } = calleeValue;

    let operands: Array<Value> = [];

    // first argument is the current scope
    operands.push(createReference(getCurrentScopeIdentifier()));

    for (let index = 1; index < functionInfo.parameters.length; index++) {
      let argumentValue = argumentValues[index - 1];

      if (argumentValue === undefined) {
        argumentValue = createNull();
      }

      operands.push(argumentValue);
    }

    value = createReference(createValueIdentifier());

    // second argument is an array of the passed arguments filled with null values
    instructions.push(
      createCallInstruction(value.identifier, null, functionInfo.definition, operands, node.loc),
    );
  }

  return {
    instructions,
    scope: null,
    value: calleeValue,
  };
};
