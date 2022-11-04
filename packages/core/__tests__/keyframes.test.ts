import { keyframes } from '@css-panda/fixture'
import { describe, expect, test } from 'vitest'
import { toKeyframeCss } from '../src/keyframes'

describe('Generates keyframes', () => {
  test('should generate keyframes', () => {
    expect(toKeyframeCss(keyframes)).toMatchInlineSnapshot(`
      "@layer tokens {
          @keyframes spin {
              to {
                  transform: rotate(360deg)
              }
          }
          @keyframes ping {
              75%, 100% {
                  transform: scale(2);
                  opacity: 0
              }
          }
          @keyframes pulse {
              50% {
                  opacity: .5
              }
          }
          @keyframes bounce {
              0%, 100% {
                  transform: translateY(-25%);
                  animation-timing-function: cubic-bezier(0.8,0,1,1)
              }
              50% {
                  transform: none;
                  animation-timing-function: cubic-bezier(0,0,0.2,1)
              }
          }
      }"
    `)
  })
})
