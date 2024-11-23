import { type Worker } from 'node:worker_threads';
import { createApplication } from '@arabesque/core';
import { createListener } from '@arabesque/listener-http';
import { createServer } from 'node:http';

export const createHeartBeat = (port: number, worker: Worker): (() => Promise<void>) => {
  let isAlive: boolean = false;

  const application = createApplication(createListener(createServer()), (context, next) => {
    if (!isAlive) {
      context.response.statusCode = 503;
    }

    return next(context);
  });

  return () => {
    return application(port).then(() => {
      worker.on('message', message => {
        console.log(message);

        isAlive = true;
      });

      console.info(`Heartbeat started, listening at port ${port}`);
    });
  };
};
