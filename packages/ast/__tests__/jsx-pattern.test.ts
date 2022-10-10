import { describe, test, expect } from 'vitest'
import { parseSync } from '../src/transform'
import { jsxPatternPlugin } from './fixture'

describe('pattern jsx', () => {
  test('should extract', () => {
    const code = `
       import { Stack } from ".panda/jsx"

       function Button() {
         return (
            <div>
               <Stack as="a" align="center" marginTop="40px" marginBottom="42px" dir="rtl">Click me</Stack>
            </div>
        )
       }
     `

    const collect = new Set()

    parseSync(code, [jsxPatternPlugin(collect)])

    expect(collect).toMatchInlineSnapshot(`
      Set {
        {
          "data": {
            "align": "center",
            "marginBottom": "42px",
            "marginTop": "40px",
          },
          "name": "Stack",
          "type": "pattern",
        },
      }
    `)
  })
})
