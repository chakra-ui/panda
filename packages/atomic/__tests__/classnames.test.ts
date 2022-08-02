import { describe, expect, test } from 'vitest';
import { classNames } from '../src/classnames';
import { createContext } from '../src/fixture';

describe('generate classnames', () => {
  test('should convert object to class', () => {
    expect(
      classNames({
        color: { light: 'red', dark: 'green' },
        opacity: { dark: 'slate400' },
      })(createContext())
    ).toMatchInlineSnapshot(`
      Set {
        "light:color-red",
        "dark:color-green",
        "dark:opacity-slate400",
      }
    `);

    expect(
      classNames({
        top: { sm: { rtl: '20px', hover: '50px' }, lg: '120px' },
      })(createContext())
    ).toMatchInlineSnapshot(`
      Set {
        "sm:rtl:top-20px",
        "sm:hover:top-50px",
        "lg:top-120px",
      }
    `);

    expect(
      classNames({
        left: { _: '20px', md: '40px' },
      })(createContext())
    ).toMatchInlineSnapshot(`
      Set {
        "left-20px",
        "md:left-40px",
      }
    `);
  });
});
