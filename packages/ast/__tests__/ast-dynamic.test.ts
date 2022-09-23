import { describe, test, expect } from 'vitest'
import { recipePlugin } from './fixture'
import { parseSync } from '../src/transform'

describe('[dynamic] ast parser', () => {
  test('should parse', () => {
    const code = `
        import { textStyle, layerStyle } from ".panda/recipe"
        
        textStyle({
            variant: "h1"
        })

        layerStyle({
           variant: "raised"
        })

        textStyle({
          variant: { _:"h4", md: "h5" }
      })

      textStyle()

      console.log("ere")
     `

    const collect = new Set()

    parseSync(code, [recipePlugin(collect)])

    expect(collect).toMatchInlineSnapshot(`
      Set {
        {
          "data": {
            "variant": "h1",
          },
          "name": "textStyle",
        },
        {
          "data": {
            "variant": "raised",
          },
          "name": "layerStyle",
        },
        {
          "data": {
            "variant": {
              "_": "h4",
              "md": "h5",
            },
          },
          "name": "textStyle",
        },
        {
          "data": {},
          "name": "textStyle",
        },
      }
    `)
  })
})
