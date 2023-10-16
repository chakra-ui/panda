import type { RecipeDefinition } from '@pandacss/types'
import { describe, expect, test } from 'vitest'
import { createRuleProcessor } from './fixture'

function processAtomicRule(config: RecipeDefinition<any>) {
  return createRuleProcessor().cva(config).toCss()
}

describe('Atomic recipe', () => {
  test('should work', () => {
    const sheet = processAtomicRule({
      base: {
        fontSize: 'lg',
      },
      variants: {
        size: {
          sm: {
            padding: '2',
            borderRadius: 'sm',
          },
          md: {
            padding: '4',
            borderRadius: 'md',
          },
        },
        variant: {
          primary: {
            color: 'white',
            backgroundColor: 'blue.500',
          },
          danger: {
            color: 'white',
            backgroundColor: 'red.500',
            _hover: {
              color: 'green',
            },
          },
        },
      },
    })

    expect(sheet).toMatchInlineSnapshot(`
      "@layer utilities {
        .fs_lg {
          font-size: var(--font-sizes-lg)
      }

        .p_2 {
          padding: var(--spacing-2)
      }

        .rounded_sm {
          border-radius: var(--radii-sm)
      }

        .p_4 {
          padding: var(--spacing-4)
      }

        .rounded_md {
          border-radius: var(--radii-md)
      }

        .text_white {
          color: var(--colors-white)
      }

        .bg_blue\\\\.500 {
          background-color: var(--colors-blue-500)
      }

        .bg_red\\\\.500 {
          background-color: var(--colors-red-500)
      }

        .hover\\\\:text_green:is(:hover, [data-hover]) {
          color: green
      }
      }"
    `)
  })
})
