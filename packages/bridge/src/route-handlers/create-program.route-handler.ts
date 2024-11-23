import { RouteHandler } from '../route-handler';
import { logHeapStatistics } from '../memory';
import { createAndSaveProgram } from '../../../jsts/src/program/program';
import { CreateProgramRequest } from '../request';

export const createProgramRouteHandler: RouteHandler<
  CreateProgramRequest['data'],
  ReturnType<typeof createAndSaveProgram>
> = context => {
  logHeapStatistics();
  const data = createAndSaveProgram(context.data.tsConfig);

  return Promise.resolve({
    data,
  });
};
