import { rule } from './rule';
import { RuleTester } from 'eslint';
import path from 'path';

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    project: `./tsconfig.json`,
    tsconfigRootDir: path.join(__dirname, 'fixtures'),
  },
});

ruleTester.run('S6606', rule, {
  valid: [
    {
      code: `
  function foo(value: string) {
    return value || 'default';
  }
  `,
      filename: path.join(__dirname, 'fixtures/index.ts'),
    },
    {
      code: `
  function foo(value: string | number) {
    return value || 'default';
  }
  `,
      filename: path.join(__dirname, 'fixtures/index.ts'),
    },
    {
      code: `
  function foo(value: string | null) {
    return value || 'default';
  }
  `,
      filename: path.join(__dirname, 'fixtures/index.ts'),
    },
    {
      code: `
  function foo(value: number | null) {
    return value || 'default';
  }
  `,
      filename: path.join(__dirname, 'fixtures/index.ts'),
    },
    {
      code: `
  function foo(value: bigint | null) {
    return value || 'default';
  }
  `,
      filename: path.join(__dirname, 'fixtures/index.ts'),
    },
    {
      code: `
  function foo(value: boolean | null) {
    return value || 'default';
  }
  `,
      filename: path.join(__dirname, 'fixtures/index.ts'),
    },
    {
      code: `
  function foo(value: { baz: number } | null) {
    return value || 'default';
  }
  `,
      filename: path.join(__dirname, 'fixtures/index.ts'),
    },
    {
      code: `
  function foo(value: Date | null) {
    return value || 'default';
  }
  `,
      filename: path.join(__dirname, 'fixtures/index.ts'),
    },
  ],
  invalid: [],
});
