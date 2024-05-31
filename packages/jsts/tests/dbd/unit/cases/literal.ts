import { runTest } from '../test';

runTest(
  'literal',
  `const foo = (5).toString;
foo = 5 + 5;
{
  (5).toString;
  (6).toString;
  
  6 + 6;
}
`,
);
