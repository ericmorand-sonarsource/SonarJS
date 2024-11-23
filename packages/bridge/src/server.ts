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
import { debug } from '../../shared/src/helpers/logging.js';
import { registerGarbageCollectionObserver, logMemoryConfiguration } from './memory.js';
import { getContext } from '../../shared/src/helpers/context.js';
import { createApplication } from '@arabesque/core';
import { createListener } from '@arabesque/listener-http';
import { createServer } from 'node:http';
import { Context } from './context';
import { createRouter } from './router';
import { createORMiddleware } from '@arabesque/logic-middlewares';

export function start(port: number): Promise<() => Promise<void>> {
  logMemoryConfiguration();

  if (getContext().debugMemory) {
    registerGarbageCollectionObserver();
  }

  debug('Starting the bridge server');

  const middleware = createORMiddleware(
    createORMiddleware(
      createRouter(),
      // Not Found route handler
      (context, next) => {
        context.setResponseStatusCode(404);

        return next(context);
      },
    ),
    // Error route handler
    (context, next) => {
      context.setResponseStatusCode(500);

      return next(context);
    },
  );

  const application = createApplication<number, Context<any>>((channel, handler) => {
    const httpListener = createListener(
      createServer(), // todo: received as argument
    );

    return httpListener(channel, context => {
      const { message, response } = context;

      const getMessageData = (): Promise<Buffer> => {
        return new Promise(resolve => {
          let data = Buffer.from('');

          message.on('data', chunk => {
            data = Buffer.concat([data, chunk]);
          });

          message.on('end', () => {
            resolve(data);
          });
        });
      };

      return getMessageData().then(data => {
        let handlerResponse: any;
        let handlerResponseStatusCode = 200;

        return handler({
          get data() {
            return JSON.parse(data.toString('utf-8'));
          },
          url: message.url || '/',
          setResponse: (value: any) => {
            handlerResponse = value;
          },
          setResponseStatusCode: value => {
            handlerResponseStatusCode = value;
          },
        }).then(() => {
          const setResponseData = () => {
            return new Promise<void>(resolve => {
              response.end(handlerResponse, resolve);
            });
          };

          response.statusCode = handlerResponseStatusCode;

          return setResponseData().then(() => {
            return {
              message,
              response,
            };
          });
        });
      });
    });
  }, middleware);

  return application(port).then(stop => {
    console.log(`Application started, listening to port ${port}.`);

    return stop;
  });
}
