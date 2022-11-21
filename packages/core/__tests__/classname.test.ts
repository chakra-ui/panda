import { createCss } from '@pandacss/shared'
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
    ).toMatchInlineSnapshot('"light:text_red dark:text_green dark:opacity_slate400"')

    expect(
      css({
        top: { sm: { rtl: '20px', hover: '50px' }, lg: '120px' },
      }),
    ).toMatchInlineSnapshot('"sm:rtl:t_20px sm:hover:t_50px lg:t_120px"')

    expect(
      css({
        left: { _: '20px', md: '40px' },
      }),
    ).toMatchInlineSnapshot('"l_20px md:l_40px"')
  })

  test('should expand shorthand before processing', () => {
    const css = createCss(createContext())
    expect(
      css({
        w: '40px',
        width: '80px',
      }),
    ).toMatchInlineSnapshot('"w_80px"')

    // override even responsive values
    expect(
      css({
        width: { _: '50px', md: '60px' },
        w: '70px',
      }),
    ).toMatchInlineSnapshot('"w_70px"')

    // override in nested condition
    expect(
      css({
        hover: { width: '40px', w: '90px' },
      }),
    ).toMatchInlineSnapshot('"hover:w_90px"')
  })

  test('should respect important', () => {
    const css = createCss(createContext())
    expect(
      css({
        color: 'red !important',
        fontSize: '30px!',
      }),
    ).toMatchInlineSnapshot('"text_red! fs_30px!"')
  })
})
