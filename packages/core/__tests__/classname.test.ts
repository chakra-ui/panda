import { createGeneratorContext } from '@pandacss/fixture'
import { createCss } from '@pandacss/shared'
import { describe, expect, test } from 'vitest'

describe('generate classnames', () => {
  test('css variables', () => {
    const css = createCss(createGeneratorContext().baseSheetContext)

    const result = css({
      '--testVariable0': '0',
      '--test-Variable-1': '1',
      '--test-variable-2': '2',
    })

    expect(result).toMatchInlineSnapshot('"--testVariable0_0 --test-Variable-1_1 --test-variable-2_2"')
  })

  test('should convert object to class', () => {
    const css = createCss(createGeneratorContext().baseSheetContext)
    expect(
      css({
        color: { _light: 'red', _dark: 'green' },
        opacity: { _dark: 'slate400' },
      }),
    ).toMatchInlineSnapshot('"light:text_red dark:text_green dark:opacity_slate400"')

    expect(
      css({
        top: { sm: { _rtl: '20px', _hover: '50px' }, lg: '120px' },
      }),
    ).toMatchInlineSnapshot('"sm:rtl:top_20px sm:hover:top_50px lg:top_120px"')

    expect(
      css({
        left: { base: '20px', md: '40px' },
      }),
    ).toMatchInlineSnapshot('"left_20px md:left_40px"')
  })

  test('should expand shorthand before processing', () => {
    const css = createCss(createGeneratorContext().baseSheetContext)
    expect(
      css({
        w: '40px',
        width: '80px',
      }),
    ).toMatchInlineSnapshot('"w_80px"')

    // override even responsive values
    expect(
      css({
        width: { base: '50px', md: '60px' },
        w: '70px',
      }),
    ).toMatchInlineSnapshot('"w_70px"')

    // override in nested condition
    expect(
      css({
        _hover: { width: '40px', w: '90px' },
      }),
    ).toMatchInlineSnapshot('"hover:w_90px"')
  })

  test('should respect important', () => {
    const css = createCss(createGeneratorContext().baseSheetContext)
    expect(
      css({
        color: 'red !important',
        fontSize: '30px!',
      }),
    ).toMatchInlineSnapshot('"text_red! fs_30px!"')
  })

  test('should omit spaces in nested selectors', () => {
    const css = createCss(createGeneratorContext().baseSheetContext)
    expect(
      css({
        '& span': {
          fontSize: '20px',
        },
        '.bold &': {
          fontWeight: 'bold',
        },
        fontSize: { sm: '50px' },
        '@media print': {
          fontSize: '40px',
        },
      }),
    ).toMatchInlineSnapshot('"[&_span]:fs_20px [.bold_&]:font_bold sm:fs_50px [@media_print]:fs_40px"')
  })

  test('should use dash for negative tokens', () => {
    const css = createCss(createGeneratorContext().baseSheetContext)
    expect(css({ mx: '-2' })).toMatchInlineSnapshot('"mx_-2"')
  })

  test('should not format the class name', () => {
    const css = createCss(
      createGeneratorContext({
        hooks: {
          'tokens:created': ({ configure }) => {
            configure({
              formatTokenName: (path) => '$' + path.join('-'),
              formatCssVar: (path) => {
                const variable = path.join('-').replace('$', '').replace('.', '')
                return {
                  var: variable as any,
                  ref: `var(--${variable})`,
                }
              },
            })
          },
        },
      }).baseSheetContext,
    )
    expect(
      css({
        background: '$pink.400',
        mx: '-$2',
      }),
    ).toMatchInlineSnapshot(`"bg_$pink.400 mx_-$2"`)
  })

  test('should format the non-string values', () => {
    const css = createCss(
      createGeneratorContext({
        hooks: {
          'tokens:created': ({ configure }) => {
            configure({
              formatTokenName: (path) => '$' + path.join('-'),
              formatCssVar: (path) => {
                const variable = path.join('-').replace('$', '').replace('.', '')
                return {
                  var: variable as any,
                  ref: `var(--${variable})`,
                }
              },
            })
          },
        },
      }).baseSheetContext,
    )
    expect(
      css({
        debug: true,
        padding: 40,
      }),
    ).toMatchInlineSnapshot('"debug_true p_40"')
  })
})
