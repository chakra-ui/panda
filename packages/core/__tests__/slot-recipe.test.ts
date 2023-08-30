import { describe, expect, test } from 'vitest'
import { processSlotRecipe } from './fixture'

describe('slot recipe ruleset', () => {
  test('should work', () => {
    expect(processSlotRecipe('button', { size: 'sm' })).toMatchInlineSnapshot(`
      "@layer recipes {
          @layer _base, _slots;
          @layer _slots {
              .button__container {
                  font-family: var(--fonts-mono)
              }
          }
          .button__container--size_sm {
              font-size: 5rem;
              line-height: 1em
          }
      }
      @layer recipes {
          @layer _slots {
              .button__icon {
                  font-size: 1.5rem
              }
          }
          .button__icon--size_sm {
              font-size: 2rem
          }
      }"
    `)
  })
})
