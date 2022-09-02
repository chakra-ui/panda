import postcss from 'postcss'
import { describe, expect, test } from 'vitest'
import { expandScreenAtRule } from '../src/expand-screen'
import { breakpoints } from '@css-panda/fixture'

describe('expand screen at rule', () => {
  test('should expand screen', () => {
    const root = postcss.parse(`
    @screen md{
        .foo{
            color: red;
        }
    }
    `)
    expandScreenAtRule(root, breakpoints)
    expect(root.toString()).toMatchInlineSnapshot(`
      "
          @media screen and (min-width: 48em){
              .foo{
                  color: red;
              }
          }
          "
    `)
  })
})
