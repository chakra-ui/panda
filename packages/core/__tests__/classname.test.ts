import { createCss } from '@css-panda/shared'
import { describe, expect, test } from 'vitest'
import { createContext } from './fixture'

describe('generate classnames', () => {
  test('should convert object to class', () => {
    const css = createCss(createContext())
    expect(
      css({
        color: { light: 'red', dark: 'green' },
        opacity: { dark: 'slate400' },
      }),
    ).toMatchInlineSnapshot('"light:color-red dark:color-green dark:opacity-slate400"')

    expect(
      css({
        top: { sm: { rtl: '20px', hover: '50px' }, lg: '120px' },
      }),
    ).toMatchInlineSnapshot('"sm:rtl:top-20px sm:hover:top-50px lg:top-120px"')

    expect(
      css({
        left: { _: '20px', md: '40px' },
      }),
    ).toMatchInlineSnapshot('"left-20px md:left-40px"')
  })

  test('should expand shorthand before processing', () => {
    const css = createCss(createContext())
    expect(
      css({
        w: '40px',
        width: '80px',
      }),
    ).toMatchInlineSnapshot('"w-80px"')

    // override even responsive values
    expect(
      css({
        width: { _: '50px', md: '60px' },
        w: '70px',
      }),
    ).toMatchInlineSnapshot('"w-70px"')

    // override in nested condition
    expect(
      css({
        hover: { width: '40px', w: '90px' },
      }),
    ).toMatchInlineSnapshot('"hover:w-90px"')
  })

  test('should respect important', () => {
    const css = createCss(createContext())
    expect(
      css({
        color: 'red !important',
        fontSize: '30px!',
      }),
    ).toMatchInlineSnapshot('"color-red! fontSize-30px!"')
  })
})
