import { describe, expect, test } from 'vitest'
import { getAtomicClassName } from '../src/atomic-classname'
import { createContext } from '../src/fixture'

describe('generate classnames', () => {
  test('should convert object to class', () => {
    expect(
      getAtomicClassName({
        color: { light: 'red', dark: 'green' },
        opacity: { dark: 'slate400' },
      })(createContext()),
    ).toMatchInlineSnapshot(`
      Set {
        "light:color-red",
        "dark:color-green",
        "dark:opacity-slate400",
      }
    `)

    expect(
      getAtomicClassName({
        top: { sm: { rtl: '20px', hover: '50px' }, lg: '120px' },
      })(createContext()),
    ).toMatchInlineSnapshot(`
      Set {
        "sm:rtl:top-20px",
        "sm:hover:top-50px",
        "lg:top-120px",
      }
    `)

    expect(
      getAtomicClassName({
        left: { _: '20px', md: '40px' },
      })(createContext()),
    ).toMatchInlineSnapshot(`
      Set {
        "left-20px",
        "md:left-40px",
      }
    `)
  })
})
