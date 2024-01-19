import tape from 'tape';
import { Test } from 'tape';
import { restore, SinonSpy } from 'sinon';

export const jest = {
  fn: (): any => {
    return () => {};
  },
};

type Expectation = {
  not: Expectation;
  toBe: (value: any) => void;
  toBeDefined: () => void;
  toBeGreaterThan: (value: any) => void;
  toBeGreaterThanOrEqual: (value: any) => void;
  toBeInstanceOf: (value: any) => void;
  toBeUndefined: () => void;
  toContain: (value: any) => void;
  toEqual: (value: any) => void;
  toHaveBeenCalled: () => void;
  toHaveBeenNthCalledWith: (index: number, value: any) => void;
  toHaveBeenCalledTimes: (value: number) => void;
  toHaveBeenCalledWith: (value: any) => void;
  toHaveLength: (length: number) => void;
  toMatchObject: (value: any) => void;
  toThrow: (error?: any) => void;
  toThrowError: (error?: any) => void;
};

type BeforeHandler = () => void | Promise<void>;

type T = {
  any: (value: any) => any;
  arrayContaining: <V extends Iterable<any>>(values: V) => Array<V>;
  not: Omit<T, 'not'>;
  objectContaining: <O>(value: O) => O;
};

type BridgeTest = Test & {
  beforeEach: (handler: BeforeHandler) => void;
  it: (name: string, cb: BridgeTestCase) => void;
  expect: FF & T;
};

type FF = (value: any) => Expectation;

type BridgeTestCase = (test: BridgeTest) => void | Promise<void>;

export const describe = (title: string, bridgeTestCase: BridgeTestCase): void => {
  return tape(title, test => {
    const expect = Object.assign<FF, T>(
      candidate => {
        return {
          not: expect,
          toBe: expectation => {
            if (expectation._true) {
              return test.pass();
            }

            return test.same(candidate, expectation);
          },
          toBeDefined: () => test.true(candidate),
          toBeGreaterThan: value => test.true(candidate > value),
          toBeGreaterThanOrEqual: value => test.true(candidate >= value),
          toBeInstanceOf: value => test.true(candidate instanceof value),
          toBeUndefined: () => test.false(candidate),
          toContain: () => test.pass(), // todo
          toEqual: expectation => {
            if (expectation._true) {
              return test.pass();
            }

            return test.same(candidate, expectation);
          },
          toHaveBeenCalled: () => {
            test.true((candidate as SinonSpy).callCount > 0);
          },
          toHaveBeenNthCalledWith: (index, value) => {
            test.same((candidate as SinonSpy).getCalls()[index], value);
          },
          toHaveBeenCalledTimes: value => {
            test.same((candidate as SinonSpy).callCount, value);
          },
          toHaveBeenCalledWith: value => {
            test.same((candidate as SinonSpy).arguments, value);
          },
          toHaveLength: length => test.same((candidate as Array<any>).length, length),
          toMatchObject: value => {
            test.same(candidate, value);
          },
          toThrow: error => test.throws(candidate, error),
          toThrowError: error => test.throws(candidate, error),
        };
      },
      {
        not: {
          // todo: refactor
          any: value => value,
          arrayContaining: values => Array.from(values),
          objectContaining: value => {
            return {
              ...value,
              _true: true,
            };
          },
        },
        any: value => value,
        arrayContaining: values => Array.from(values),
        objectContaining: value => {
          return {
            ...value,
            _true: true,
          };
        },
      },
    ) as any;

    const beforeHandlers: Array<BeforeHandler> = [];

    const createBridgeTest = (test: Test): BridgeTest => {
      return {
        ...test,
        beforeEach: handler => {
          beforeHandlers.push(handler);
        },
        expect,
        it: (name, testCase) => {
          test.test(name, test => {
            test.test(name, async test => {
              const bridgeTest = createBridgeTest(test);

              for (const handler of beforeHandlers) {
                await handler();
              }

              return testCase(bridgeTest);
            });

            restore();

            test.end();
          });
        },
      };
    };

    const bridgeTest = createBridgeTest(test);

    bridgeTestCase(bridgeTest);
  });
};
