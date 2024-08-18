import { createGeneratorContext } from '@pandacss/fixture'
import type { Dict } from '@pandacss/types'
import { describe, expect, test } from 'vitest'

const keyframes = (obj?: Dict) => {
  const ctx = createGeneratorContext(obj ? { theme: { keyframes: obj } } : undefined)
  const sheet = ctx.createSheet()
  ctx.appendCssOfType('keyframes', sheet)
  return sheet.toCss()
}

describe('keyframes', () => {
  test('default keyframes', () => {
    expect(keyframes()).toMatchInlineSnapshot(`
      "@layer tokens {
        @keyframes spin {
          to {
            transform: rotate(360deg);
      }
      }

        @keyframes ping {
          75%,100% {
            transform: scale(2);
            opacity: 0;
      }
      }

        @keyframes pulse {
          50% {
            opacity: 0.5;
      }
      }

        @keyframes bounce {
          0%,100% {
            transform: translateY(-25%);
            animation-timing-function: cubic-bezier(0.8,0,1,1);
      }

          50% {
            transform: none;
            animation-timing-function: cubic-bezier(0,0,0.2,1);
      }
      }
      }"
    `)
  })

  test('should allow tokens', () => {
    expect(
      keyframes({
        roll: { from: { h: '4' }, to: { h: '8' } },
      }),
    ).toMatchInlineSnapshot(`
      "@layer tokens {
        @keyframes spin {
          to {
            transform: rotate(360deg);
      }
      }

        @keyframes ping {
          75%,100% {
            transform: scale(2);
            opacity: 0;
      }
      }

        @keyframes pulse {
          50% {
            opacity: 0.5;
      }
      }

        @keyframes bounce {
          0%,100% {
            transform: translateY(-25%);
            animation-timing-function: cubic-bezier(0.8,0,1,1);
      }

          50% {
            transform: none;
            animation-timing-function: cubic-bezier(0,0,0.2,1);
      }
      }
      }"
    `)
  })
})
