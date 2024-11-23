import { RouteHandler } from '../route-handler';
import { logHeapStatistics } from '../memory';
import { deleteProgram } from '../../../jsts/src/program/program';
import { DeleteProgramRequest } from '../request';

export const deleteProgramRouteHandler: RouteHandler<
  DeleteProgramRequest['data'],
  {}
> = context => {
  logHeapStatistics();
  deleteProgram(context.data.programId);
  logHeapStatistics();

  return Promise.resolve({
    data: {},
  });
};
