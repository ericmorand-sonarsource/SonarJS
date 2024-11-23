export interface Context<Data extends Record<string, any>> {
  readonly data: Data;
  readonly url: string;
  setResponse: (value: any) => void; // todo: could we use `set response` instead?
  setResponseStatusCode: (value: number) => void;
}
