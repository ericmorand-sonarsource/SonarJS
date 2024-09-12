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
// https://sonarsource.github.io/rspec/#/rspec/S2301/javascript

import { Rule } from 'eslint';
import {
  generateMeta,
  getTypeFromTreeNode,
  getVariableFromIdentifier,
  isBooleanType,
  isRequiredParserServices,
  report,
  toSecondaryLocation,
} from '../helpers';
import type { BlockStatement, Node as ESTreeNode } from 'estree';
import NodeParentExtension = Rule.NodeParentExtension;
import { meta as rspecMeta } from './meta';

type Node = ESTreeNode & NodeParentExtension;

const message =
  'Provide multiple methods instead of using "{{parameterName}}" to determine which action to take.';

/**
 * A suspect test node is a test node that is the only child of a function body
 */
export const S2301: Rule.RuleModule = {
  meta: generateMeta(rspecMeta as Rule.RuleMetaData, {}, true),
  create: context => {
    const suspectTestNodes: Array<Node> = [];
    const suspectBodies: Array<Node> = [];
    const suspectReturnStatements: Array<Node> = [];

    const handleFunctionBody = (node: BlockStatement) => {
      const statements = node.body;

      if (statements.length === 1) {
        suspectBodies.push(statements[0] as Node);
      }
    };

    return {
      FunctionDeclaration: node => {
        handleFunctionBody(node.body);
      },
      FunctionExpression: node => {
        handleFunctionBody(node.body);
      },
      ArrowFunctionExpression: node => {
        if (node.body.type === 'BlockStatement') {
          handleFunctionBody(node.body);
        }
      },
      Identifier: node => {
        const isAChildOf = (identifier: Node, node: Node): boolean => {
          if (identifier.parent === node) {
            return true;
          }

          if (identifier.parent === null) {
            return false;
          }

          return isAChildOf(identifier.parent, node);
        };

        // An identifier is suspect if it is a direct or indirect child of a suspect node,
        // or if it is a suspect node itself
        const isSuspect =
          suspectTestNodes.find(testNode => {
            return testNode === node || isAChildOf(node, testNode);
          }) !== undefined;

        if (!isSuspect) {
          return;
        }

        const variable = getVariableFromIdentifier(node, context.getScope());

        if (variable) {
          const definition = variable.defs[variable.defs.length - 1];

          if (
            definition?.type === 'Parameter' &&
            isRequiredParserServices(context.parserServices)
          ) {
            const type = getTypeFromTreeNode(definition.name, context.parserServices);

            if (isBooleanType(type)) {
              report(
                context,
                {
                  message,
                  loc: node.loc!,
                  data: {
                    parameterName: variable.name,
                  },
                },
                [
                  toSecondaryLocation(
                    definition.name,
                    `Parameter "${variable.name}" was declared here`,
                  ),
                ],
              );
            }
          }
        }
      },
      ConditionalExpression: node => {
        /**
         * A conditional expression is suspect if it is the direct child of a suspect body or the direct child of a suspect return statement
         */
        const parent = node.parent;

        if (suspectBodies.includes(parent) || suspectReturnStatements.includes(parent)) {
          suspectTestNodes.push(node.test as Node);
        }
      },
      IfStatement: node => {
        if (suspectBodies.includes(node)) {
          suspectTestNodes.push(node.test as Node);
        }
      },
      'IfStatement:exit': node => {
        if (suspectBodies.includes(node)) {
          suspectTestNodes.pop();
        }
      },
      ReturnStatement: node => {
        if (suspectBodies.includes(node)) {
          suspectReturnStatements.push(node);
        }
      },
      'ReturnStatement:exit': node => {
        if (suspectBodies.includes(node)) {
          suspectReturnStatements.pop();
        }
      },
    };
  },
};

export const rule = S2301;
