import postcss from 'postcss'
import { describe, expect, test } from 'vitest'
import { expandScreenAtRule } from '../src/expand-screen-at-rule'
import { breakpoints } from '@css-panda/fixture'

describe.only('expand screen at rule', () => {
  test('should expand screen', () => {
    const root = postcss.parse(`
    @screen md{
        .foo{
            color: red;
        }
    }
    `)
    expandScreenAtRule(breakpoints)(root)
    expect(root.toString()).toMatchInlineSnapshot(`
      "
          @media (min-width: 48em){
              .foo{
                  color: red;
              }
          }
          "
    `)
  })
})
