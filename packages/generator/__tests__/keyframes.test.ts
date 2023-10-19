import { fixtureDefaults } from '@pandacss/fixture'
import { describe, expect, test } from 'vitest'
import { createGenerator } from '../src'
import { generateKeyframeCss } from '../src/artifacts/css/keyframe-css'

describe('Generates keyframes', () => {
  test('should generate keyframes', () => {
    expect(generateKeyframeCss(createGenerator(fixtureDefaults))).toMatchInlineSnapshot(`
      "@layer tokens {
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes ping {
          75%, 100% {
            opacity: 0;
            transform: scale(2);
          }
        }

        @keyframes pulse {
          50% {
            opacity: .5;
          }
        }

        @keyframes bounce {
          0%, 100% {
            animation-timing-function: cubic-bezier(.8, 0, 1, 1);
            transform: translateY(-25%);
          }

          50% {
            animation-timing-function: cubic-bezier(0, 0, .2, 1);
            transform: none;
          }
        }
      }
      "
    `)
  })
})
