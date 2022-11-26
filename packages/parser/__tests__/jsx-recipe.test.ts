import { describe, test, expect } from 'vitest'
import { jsxRecipeParser } from './fixture'

describe('pattern jsx', () => {
  test('should extract', () => {
    const code = `
       function ActionButton() {
         return (
            <div>
               <Button size="sm" mt="40px">Welcome</Button>
               <Button size="sm" variant={{ base: "outline", md: "solid" }}>Welcome</Button>
               <button size="fluff">Hello</button>
               <Random size="50px" />
            </div>
        )
       }
     `

    expect(jsxRecipeParser(code)).toMatchInlineSnapshot(`
      Set {
        {
          "data": {
            "size": "sm",
          },
          "name": "Button",
          "type": "recipe",
        },
        {
          "data": {
            "size": "sm",
            "variant": {
              "base": "outline",
              "md": "solid",
            },
          },
          "name": "Button",
          "type": "recipe",
        },
        {
          "data": {},
          "name": "Random",
          "type": "jsx",
        },
      }
    `)
  })
})
