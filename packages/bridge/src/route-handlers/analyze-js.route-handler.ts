import { RouteHandler } from '../route-handler';
import { JsTsRequest, readFileLazily } from '../request';
import { analyzeJSTS } from '../../../jsts/src/analysis/analyzer';
import { JsTsAnalysisOutput } from '../../../jsts/src/analysis/analysis';

export const analyzeJsRouteHandler: RouteHandler<
  JsTsRequest['data'],
  JsTsAnalysisOutput
> = context => {
  return readFileLazily(context.data)
    .then(content => {
      const output = analyzeJSTS(content, 'js');

      return {
        data: output,
      };
    })
    .catch(error => {
      return {
        data: {
          issues: [],
          parsingError: {
            code: 'PARSING' as any,
            message: `An error happened ${(error as Error).message}`,
          },
        },
      };
    });
};
