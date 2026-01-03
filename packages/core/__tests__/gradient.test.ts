import type { Dict } from '@pandacss/types'
import { describe, expect, test } from 'vitest'
import { createRuleProcessor } from './fixture'

describe('gradient utilities', () => {
  const processor = createRuleProcessor({
    theme: {
      extend: {
        tokens: {
          gradients: {
            primary: { value: 'linear-gradient(to right, #ff0000, #0000ff)' },
          },
        },
      },
    },
  })

  const css = (styles: Dict) => {
    const result = processor.clone().css(styles)
    return { className: result.getClassNames(), css: result.toCss() }
  }

  test('bgGradient with gradient token', () => {
    expect(css({ bgGradient: 'primary' })).toMatchInlineSnapshot(`
      {
        "className": [
          "bg-grad_primary",
        ],
        "css": "@layer utilities {
        .bg-grad_primary {
          background-image: var(--gradients-primary);
      }
      }",
      }
    `)
  })

  test('bgGradient with direction shortcut', () => {
    expect(css({ bgGradient: 'to-r' })).toMatchInlineSnapshot(`
      {
        "className": [
          "bg-grad_to-r",
        ],
        "css": "@layer utilities {
        .bg-grad_to-r {
          --gradient-stops: var(--gradient-via-stops, var(--gradient-position), var(--gradient-from) var(--gradient-from-position), var(--gradient-to) var(--gradient-to-position));
          --gradient-position: to right;
          background-image: linear-gradient(var(--gradient-stops));
      }
      }",
      }
    `)
  })

  test('bgGradient with token references', () => {
    expect(css({ bgGradient: 'linear-gradient({colors.red.200}, {colors.blue.300})' })).toMatchInlineSnapshot(`
      {
        "className": [
          "bg-grad_linear-gradient\\(\\{colors\\.red\\.200\\}\\,_\\{colors\\.blue\\.300\\}\\)",
        ],
        "css": "@layer utilities {
        .bg-grad_linear-gradient\\(\\{colors\\.red\\.200\\}\\,_\\{colors\\.blue\\.300\\}\\) {
          background-image: linear-gradient(var(--colors-red-200), var(--colors-blue-300));
      }
      }",
      }
    `)
  })

  test('textGradient with token references', () => {
    expect(css({ textGradient: 'linear-gradient({colors.red.200}, {colors.blue.300})' })).toMatchInlineSnapshot(`
      {
        "className": [
          "txt-grad_linear-gradient\\(\\{colors\\.red\\.200\\}\\,_\\{colors\\.blue\\.300\\}\\)",
        ],
        "css": "@layer utilities {
        .txt-grad_linear-gradient\\(\\{colors\\.red\\.200\\}\\,_\\{colors\\.blue\\.300\\}\\) {
          background-image: linear-gradient(var(--colors-red-200), var(--colors-blue-300));
          -webkit-background-clip: text;
          color: transparent;
      }
      }",
      }
    `)
  })
})
