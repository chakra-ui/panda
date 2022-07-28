import * as v from 'vitest';
import { createVar } from '../src/css-var';

v.describe('css var', () => {
  v.test('basic', () => {
    v.expect(createVar('-2.4', { prefix: 'vc-spacing' }))
      .toMatchInlineSnapshot(`
        {
          "ref": "var(--vc-spacing--2\\\\.4)",
          "var": "--vc-spacing--2\\\\.4",
        }
      `);
  });
});
