import { describe, test, expect } from 'vitest';
import { walkObject } from '../src';

describe('walk object', () => {
  test('walk object', () => {
    const target = {
      a: 1,
      b: {
        c: 2,
        d: {
          e: 3,
          f: 4,
        },
        e: [1, 2],
      },
    };

    const result: any[] = [];
    walkObject(
      target,
      (value, paths) => {
        result.push({ key: paths.join('.'), value });
      },
      { maxDepth: 2 }
    );

    expect(result).toMatchInlineSnapshot(`
      [
        {
          "key": "a",
          "value": 1,
        },
        {
          "key": "b.c",
          "value": 2,
        },
        {
          "key": "b.d",
          "value": {
            "e": 3,
            "f": 4,
          },
        },
        {
          "key": "b.e",
          "value": [
            1,
            2,
          ],
        },
      ]
    `);
  });
});
