import { createRuleProcessor } from '@pandacss/fixture'
import type { Dict } from '@pandacss/types'
import { describe, expect, test } from 'vitest'
import { createColorMixTransform } from '../../preset-base/src/utilities/color-mix-transform'

describe('color-mix', () => {
  const api = createRuleProcessor({
    utilities: {
      background: {
        shorthand: 'bg',
        className: 'bg',
        values: 'colors',
        transform: createColorMixTransform('background'),
      },
      gradientFrom: {
        className: 'from',
        values: 'colors',
        transform(value, args) {
          const mix = args.utils.colorMix(value, args)
          return {
            '--gradient-from': mix.value,
          }
        },
        // could have been
        // transform: createColorMixTransform('--gradient-from'),
      },
    },
    theme: {
      extend: {
        tokens: {
          opacity: {
            half: { value: 0.5 },
          },
        },
      },
    },
  })

  const css = (styles: Dict) => {
    const result = api.clone().css(styles)
    return { className: result.getClassNames(), css: result.toCss() }
  }

  test('native CSS color', () => {
    expect(css({ bg: 'red/30' })).toMatchInlineSnapshot(`
      {
        "className": [
          "bg_red\\/30",
        ],
        "css": "@layer utilities {
        .bg_red\\/30 {
          --mix-background: color-mix(in srgb, red 30%, transparent);
          background: var(--mix-background, red);
      }
      }",
      }
    `)
  })

  test('native CSS color', () => {
    expect(css({ bg: 'red/30' })).toMatchInlineSnapshot(`
      {
        "className": [
          "bg_red\\/30",
        ],
        "css": "@layer utilities {
        .bg_red\\/30 {
          --mix-background: color-mix(in srgb, red 30%, transparent);
          background: var(--mix-background, red);
      }
      }",
      }
    `)
  })

  test('config token color', () => {
    expect(css({ bg: 'red.300/30' })).toMatchInlineSnapshot(`
      {
        "className": [
          "bg_red\\.300\\/30",
        ],
        "css": "@layer utilities {
        .bg_red\\.300\\/30 {
          --mix-background: color-mix(in srgb, var(--colors-red-300) 30%, transparent);
          background: var(--mix-background, var(--colors-red-300));
      }
      }",
      }
    `)
  })

  test('decimal opacity', () => {
    expect(css({ bg: 'red/0.33' })).toMatchInlineSnapshot(`
      {
        "className": [
          "bg_red\\/0\\.33",
        ],
        "css": "@layer utilities {
        .bg_red\\/0\\.33 {
          --mix-background: color-mix(in srgb, red 0.33%, transparent);
          background: var(--mix-background, red);
      }
      }",
      }
    `)
  })

  test('percent opacity', () => {
    expect(css({ bg: 'red/33' })).toMatchInlineSnapshot(`
      {
        "className": [
          "bg_red\\/33",
        ],
        "css": "@layer utilities {
        .bg_red\\/33 {
          --mix-background: color-mix(in srgb, red 33%, transparent);
          background: var(--mix-background, red);
      }
      }",
      }
    `)
  })

  // console.log(api['context'].utility.transform('gradientFrom', 'red/33'))
  test('inside var', () => {
    expect(css({ gradientFrom: 'red/33' })).toMatchInlineSnapshot(`
      {
        "className": [
          "from_red\\/33",
        ],
        "css": "@layer utilities {
        .from_red\\/33 {
          --gradient-from: color-mix(in srgb, red 33%, transparent);
      }
      }",
      }
    `)
  })

  // below are invalid cases

  test('wrong format', () => {
    expect(css({ bg: 'xx1x//30' })).toMatchInlineSnapshot(`
      {
        "className": [
          "bg_xx1x\\/\\/30",
        ],
        "css": "@layer utilities {
        .bg_xx1x\\/\\/30 {
          background: xx1x//30;
      }
      }",
      }
    `)
  })

  test('wrong opacity', () => {
    expect(css({ bg: 'red/abc' })).toMatchInlineSnapshot(`
      {
        "className": [
          "bg_red\\/abc",
        ],
        "css": "@layer utilities {
        .bg_red\\/abc {
          background: red/abc;
      }
      }",
      }
    `)
  })

  test('wrong number format', () => {
    expect(css({ bg: 'red/0,4' })).toMatchInlineSnapshot(`
      {
        "className": [
          "bg_red\\/0\\,4",
        ],
        "css": "@layer utilities {
        .bg_red\\/0\\,4 {
          background: red/0,4;
      }
      }",
      }
    `)
  })

  test('invalid number format', () => {
    expect(css({ bg: 'red/0..,4' })).toMatchInlineSnapshot(`
      {
        "className": [
          "bg_red\\/0\\.\\.\\,4",
        ],
        "css": "@layer utilities {
        .bg_red\\/0\\.\\.\\,4 {
          background: red/0..,4;
      }
      }",
      }
    `)
  })

  test('opacity token', () => {
    expect(css({ bg: 'red/half' })).toMatchInlineSnapshot(`
      {
        "className": [
          "bg_red\\/half",
        ],
        "css": "@layer utilities {
        .bg_red\\/half {
          background: red/half;
      }
      }",
      }
    `)
  })
})
