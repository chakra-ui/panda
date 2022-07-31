import { describe, expect, test } from 'vitest';
import { classNames, createRule } from '../src/atomic';

describe('atomic rules', () => {
  test('should write atomic', () => {
    expect(createRule('.foo', [['color', 'red']]).toString()).toMatchInlineSnapshot(`
      ".foo {
          color: red
      }"
    `);
  });

  test('should convert object to class', () => {
    expect(
      classNames(
        {
          bg: 'red.300',
          color: { light: 'red', dark: 'green' },
          ml: { ltr: '4', rtl: '-4' },
          opacity: { bg: { dark: 'slate400' } },
          '&:hover': {
            bg: 'red.400',
          },
          'body.dark &': {
            bg: 'red.40000',
          },
        },
        ({ prop, value, conditions }) => [...conditions, prop, value].join(':')
      )
    ).toMatchInlineSnapshot(`
      Set {
        "bg:red.300",
        "light:color:red",
        "dark:color:green",
        "ltr:ml:4",
        "rtl:ml:-4",
        "bg:dark:opacity:slate400",
        "bg:&:hover:red.400",
        "bg:body.dark &:red.40000",
      }
    `);
  });
});
