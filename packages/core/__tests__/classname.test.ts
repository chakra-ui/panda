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
})
