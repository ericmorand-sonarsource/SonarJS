import { type Context } from './context';

export type RouteHandler<Input extends Record<string, any>, Output extends Record<string, any>> = (
  context: Context<Input>,
) => Promise<{
  data: Output;
  statusCode?: number;
}>;
