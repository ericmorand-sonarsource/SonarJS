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
import { Middleware } from '@arabesque/core';
import { Context } from './context';
import { analyzeProject } from '../../jsts/src/analysis/projectAnalysis/projectAnalyzer';
import { createProgramRouteHandler } from './route-handlers/create-program.route-handler';
import { analyzeJsRouteHandler } from './route-handlers/analyze-js.route-handler';
import { initLinterRouteHandler } from './route-handlers/init-linter.route-handler';
import { deleteProgramRouteHandler } from './route-handlers/delete-program.route-handler';
import { RouteHandler } from './route-handler';
import { ProjectAnalysisRequest } from './request';
import { ProjectAnalysisOutput } from '../../jsts/src/analysis/projectAnalysis/projectAnalysis';

export const createRouter = (): Middleware<Context<any>> => {
  return (context, next) => {
    let routeHandler: RouteHandler<any, any> | null = null;

    switch (context.url) {
      case '/analyze-project': {
        routeHandler = <RouteHandler<ProjectAnalysisRequest['data'], ProjectAnalysisOutput>>(
          (context => {
            return analyzeProject(context.data).then(response => {
              return {
                data: response,
              };
            });
          })
        );

        break;
      }

      case '/create-program': {
        routeHandler = createProgramRouteHandler;
        break;
      }

      case '/delete-program': {
        routeHandler = deleteProgramRouteHandler;
        break;
      }

      case '/analyze-js': {
        routeHandler = analyzeJsRouteHandler;
        break;
      }

      case '/init-linter': {
        routeHandler = initLinterRouteHandler;
        break;
      }
    }

    return routeHandler
      ? routeHandler(context)
          .then(result => {
            context.setResponse(JSON.stringify(result.data));

            if (result.statusCode) {
              context.setResponseStatusCode(result.statusCode);
            }

            return next(context);
          })
          .catch(() => {
            return Promise.resolve(context);
          })
      : Promise.resolve(context);
  };
};
