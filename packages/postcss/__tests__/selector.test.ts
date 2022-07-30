import { describe, expect, test } from 'vitest';
import { selectors } from '../src/selector';

describe('selector', () => {
  test('[single value] generate correct based on entry', () => {
    expect(selectors(['&::after', 'bg'], 'red400')).toEqual(
      expect.objectContaining({
        raw: ['[&::after]:bg:red400::after'],
        entry: ['bg', 'red400'],
      })
    );

    expect(selectors(['&:hover:focus', 'bg'], 'red400')).toEqual(
      expect.objectContaining({
        raw: ['[&:hover:focus]:bg:red400:hover:focus'],
        entry: ['bg', 'red400'],
      })
    );

    expect(selectors(['&>p', 'bg'], 'red400')).toEqual(
      expect.objectContaining({
        raw: ['[&>p]:bg:red400> p'],
        entry: ['bg', 'red400'],
      })
    );

    expect(selectors(['body.dark &.confirm', 'color'], 'red400')).toEqual(
      expect.objectContaining({
        raw: ['body.dark', '[body.dark &.confirm]:color:red400.confirm'],
        entry: ['color', 'red400'],
      })
    );
  });

  const extension = (v, c) => {
    if (c.includes('hover')) return v + ':hover';
    return v;
  };

  test.only('[multiple] generate correct based on entry', () => {
    expect(selectors(['&::after', 'bg', 'dark'], 'blue400')).toEqual(
      expect.objectContaining({
        raw: ['[&::after]:dark:bg:blue400::after'],
        entry: ['bg', 'blue400'],
      })
    );

    expect(selectors(['&::after', 'bg', 'sm', 'hover', 'dark'], 'blue400', extension)).toMatchInlineSnapshot(`
      {
        "entry": [
          "bg",
          "blue400",
        ],
        "raw": [
          "[&::after]:sm:hover:dark:bg:blue400::after:hover",
        ],
        "selector": [
          "\\\\[&\\\\:\\\\:after\\\\]\\\\:sm\\\\:hover\\\\:dark\\\\:bg\\\\:blue400::after:hover",
        ],
      }
    `);
  });
});
