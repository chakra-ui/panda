import { describe, expect, test } from 'vitest';
import { atomicRule } from '../src/atomic-rule';
import { wrap } from '../src/wrap';

describe('wrap rule', () => {
  test('should wrap with at rule', () => {
    const rule = atomicRule('.foo', { color: 'red', '--test': '40px' });
    const wrapped = wrap(rule, { type: 'at-rule', name: 'condition', params: 'dark' });
    expect(wrapped.toString()).toMatchInlineSnapshot(`
      "@condition dark {
          .foo {
              color: red;
              --test: 40px
          }
      }"
    `);
  });
});
