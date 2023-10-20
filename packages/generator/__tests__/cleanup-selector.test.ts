import { expect, test } from 'vitest'
import { cleanupSelectors } from '../src/artifacts/css/token-css'

const css = `
  @layer tokens {

      .class1, :AAAA .class2, :host .class3, :AAAA, :BBBB, ::CCCC .class2 {
          font-size: 1rem;
      }

      :host .class2, :AAAA, :BBBB, ::CCCC {
          font-size: 2rem;
      }
    }
`

test('cleanupSelectors - single', () => {
  const varSelector = ':AAAA'

  expect(cleanupSelectors(css, varSelector)).toMatchInlineSnapshot(`
    "
      @layer tokens {

          .class1,  .class2, :host .class3, :BBBB, ::CCCC .class2 {
              font-size: 1rem;
          }

          :host .class2, :BBBB, ::CCCC {
              font-size: 2rem;
          }
        }
    "
  `)
})

test('cleanupSelectors - multiple', () => {
  const varSelector = ':AAAA, :BBBB, ::CCCC'

  expect(cleanupSelectors(css, varSelector)).toMatchInlineSnapshot(`
    "
      @layer tokens {

          .class1, :AAAA .class2, :host .class3, :AAAA, :BBBB, ::CCCC .class2 {
              font-size: 1rem;
          }

          :host .class2, :AAAA, :BBBB, ::CCCC {
              font-size: 2rem;
          }
        }
    "
  `)
})
