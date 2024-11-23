import { type RouteHandler } from '../route-handler';
import { type InitLinterRequest } from '../request';
import { initializeLinter } from '../../../jsts/src/linter/linters';

export const initLinterRouteHandler: RouteHandler<InitLinterRequest['data'], {}> = context => {
  const { rules, environments, globals, linterId, baseDir } = context.data;

  return initializeLinter(rules, environments, globals, baseDir, linterId).then(() => {
    return {
      data: {},
    };
  });
};
