import { describe, test, expect } from 'vitest'
import { recipeParser } from './fixture'

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

    expect(recipeParser(code)).toMatchInlineSnapshot(`
      Map {
        "textStyle" => Set {
          {
            "data": {
              "variant": "h1",
            },
            "name": "textStyle",
            "type": "recipe",
          },
          {
            "data": {
              "variant": {
                "_": "h4",
                "md": "h5",
              },
            },
            "name": "textStyle",
            "type": "recipe",
          },
          {
            "data": {},
            "name": "textStyle",
            "type": "recipe",
          },
        },
        "layerStyle" => Set {
          {
            "data": {
              "variant": "raised",
            },
            "name": "layerStyle",
            "type": "recipe",
          },
        },
      }
    `)
  })
})
