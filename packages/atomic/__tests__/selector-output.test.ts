import { describe, expect, test } from 'vitest';
import { SelectorOutput } from '../src/selector-output';

describe('selector output', () => {
  test('[single value] generate correct based on entry', () => {
    const output = new SelectorOutput(['bg', '400'].join(':')).pseudoSelector('&::after');
    expect(output.selector).toMatchInlineSnapshot('" .bg\\\\:400::after"');

    //   expect(selectors(['&:hover:focus', 'bg'], 'red400')).toEqual(
    //     expect.objectContaining({
    //       raw: ['[&:hover:focus]:bg:red400:hover:focus'],
    //       entry: ['bg', 'red400'],
    //     })
    //   );

    //   expect(selectors(['&>p', 'bg'], 'red400')).toEqual(
    //     expect.objectContaining({
    //       raw: ['[&>p]:bg:red400> p'],
    //       entry: ['bg', 'red400'],
    //     })
    //   );

    //   expect(selectors(['body.dark &.confirm', 'color'], 'red400')).toEqual(
    //     expect.objectContaining({
    //       raw: ['body.dark', '[body.dark &.confirm]:color:red400.confirm'],
    //       entry: ['color', 'red400'],
    //     })
    //   );
    // });
  });
});
