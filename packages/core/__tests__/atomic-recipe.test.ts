import type { Dict } from '@pandacss/types'
import { describe, expect, test } from 'vitest'
import { Stylesheet } from '../src'
import { createContext } from './fixture'

function recipe(values: Dict) {
  const ctx = createContext()
  const sheet = new Stylesheet(ctx)
  sheet.processAtomicRecipe(values)
  return sheet.toCss({ optimize: true })
}

describe('Atomic recipe', () => {
  test('should work', () => {
    const sheet = recipe({
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

        .bg_blue\\\\.500 {
          background-color: blue.500
          }

        .text_white {
          color: white
          }

        .bg_red\\\\.500 {
          background-color: var(--colors-red-500)
          }

        .hover\\\\:text_green:hover {
          color: green
              }
      }"
    `)
  })
})
