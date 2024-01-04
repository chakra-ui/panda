import { createGeneratorContext } from '@pandacss/fixture'
import { describe, expect, test } from 'vitest'

const keyframes = () => {
  const ctx = createGeneratorContext()
  const sheet = ctx.createSheet()
  ctx.appendCss('keyframes', sheet)
  return sheet.toCss({ optimize: true })
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
            opacity: .5;
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
