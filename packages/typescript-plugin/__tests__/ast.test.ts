import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import {
  findEnclosingDefineCall,
  getContainerPath,
  getSemanticTokenCursorInfo,
  getStyleObjectCursorInfo,
} from '../src/service/ast'

function parse(source: string) {
  return ts.createSourceFile('panda.config.ts', source, ts.ScriptTarget.Latest, true)
}

describe('a user editing panda.config.ts', () => {
  it("gets no suggestions if they haven't wrapped their styles in defineGlobalStyles/defineRecipe yet", () => {
    const source = `
      import { defineConfig } from '@pandacss/dev'
      export default defineConfig({ globalCss: { color: 're' } })
    `
    const position = source.indexOf("'r") + 2
    expect(getStyleObjectCursorInfo(parse(source), position)).toBeUndefined()
  })

  it('gets property-name suggestions when they open an empty line inside a global style rule', () => {
    const source = `
      import { defineConfig, defineGlobalStyles } from '@pandacss/dev'
      export default defineConfig({
        globalCss: defineGlobalStyles({ html: {  } }),
      })
    `
    const position = source.lastIndexOf('{  }') + 1
    const info = getStyleObjectCursorInfo(parse(source), position)

    expect(info).toMatchObject({ cursorKind: 'key', existingKeys: [] })
  })

  it('gets value suggestions while typing a property value inside a global style rule', () => {
    const source = `
      import { defineConfig, defineGlobalStyles } from '@pandacss/dev'
      export default defineConfig({
        globalCss: defineGlobalStyles({ html: { color: 'r' } }),
      })
    `
    const position = source.indexOf("'r'") + 2
    const info = getStyleObjectCursorInfo(parse(source), position)

    expect(info).toMatchObject({ cursorKind: 'value', propertyPath: ['color'] })
  })

  it('doesn\'t get suggestions while typing the selector itself (e.g. "html"), only inside its rule', () => {
    const source = `
      import { defineConfig, defineGlobalStyles } from '@pandacss/dev'
      export default defineConfig({
        globalCss: defineGlobalStyles({ html: { margin: 0 } }),
      })
    `
    const position = source.indexOf('html') + 1
    expect(getStyleObjectCursorInfo(parse(source), position)).toBeUndefined()
  })

  it("gets value suggestions while typing a color inside a recipe's base styles", () => {
    const source = `
      import { defineConfig, defineRecipe } from '@pandacss/dev'
      export default defineConfig({
        recipes: { button: defineRecipe({ base: { color: 'red.500' } }) },
      })
    `
    const position = source.indexOf("'red.500'") + 2
    const info = getStyleObjectCursorInfo(parse(source), position)

    expect(info).toMatchObject({ cursorKind: 'value', propertyPath: ['color'] })
  })

  it('also gets value suggestions while editing a recipe variant, e.g. variants.size.sm', () => {
    const source = `
      import { defineConfig, defineRecipe } from '@pandacss/dev'
      export default defineConfig({
        recipes: { button: defineRecipe({ variants: { size: { sm: { color: 'red.500' } } } }) },
      })
    `
    const position = source.indexOf("'red.500'") + 2
    const info = getStyleObjectCursorInfo(parse(source), position)

    expect(info).toMatchObject({ cursorKind: 'value', propertyPath: ['color'] })
  })

  it('also gets suggestions inside a condition nested in a recipe variant, e.g. variants.size.sm._hover', () => {
    const source = `
      import { defineConfig, defineRecipe } from '@pandacss/dev'
      export default defineConfig({
        recipes: {
          button: defineRecipe({
            variants: { size: { sm: { color: 'red.500', _hover: { color: 'blue.500' } } } },
          }),
        },
      })
    `
    const position = source.lastIndexOf("'blue.500'") + 2
    const info = getStyleObjectCursorInfo(parse(source), position)

    expect(info).toMatchObject({ cursorKind: 'value', propertyPath: ['_hover', 'color'] })
  })

  it('also gets suggestions inside a condition nested in base, e.g. base._hover', () => {
    const source = `
      import { defineConfig, defineRecipe } from '@pandacss/dev'
      export default defineConfig({
        recipes: { button: defineRecipe({ base: { color: 'red.500', _hover: { color: 'blue.500' } } }) },
      })
    `
    const position = source.lastIndexOf("'blue.500'") + 2
    const info = getStyleObjectCursorInfo(parse(source), position)

    expect(info).toMatchObject({ cursorKind: 'value', propertyPath: ['_hover', 'color'] })
  })

  it('gets property-name suggestions on an empty line inside a nested condition, e.g. base._hover', () => {
    const source = `
      import { defineConfig, defineRecipe } from '@pandacss/dev'
      export default defineConfig({
        recipes: { button: defineRecipe({ base: { _hover: {  } } }) },
      })
    `
    const position = source.lastIndexOf('{  }') + 1
    const info = getStyleObjectCursorInfo(parse(source), position)

    expect(info).toMatchObject({ cursorKind: 'key', existingKeys: [] })
  })

  it("gets the outer property's value suggestions inside its own inline conditional value, e.g. backgroundColor: { sm: 're' }", () => {
    const source = `
      import { defineConfig, defineRecipe } from '@pandacss/dev'
      export default defineConfig({
        recipes: { button: defineRecipe({ base: { backgroundColor: { base: 'blue.500', sm: 're' } } }) },
      })
    `
    const position = source.lastIndexOf("'re'") + 2
    const info = getStyleObjectCursorInfo(parse(source), position)

    expect(info).toMatchObject({ cursorKind: 'value', propertyPath: ['backgroundColor', 'sm'] })
  })

  it('gets condition suggestions (not utility names) on an empty key inside an inline conditional value', () => {
    const source = `
      import { defineConfig, defineRecipe } from '@pandacss/dev'
      export default defineConfig({
        recipes: { button: defineRecipe({ base: { backgroundColor: { base: 'blue.500',  } } }) },
      })
    `
    const position = source.lastIndexOf(',  }') + 2
    const info = getStyleObjectCursorInfo(parse(source), position)

    expect(info).toMatchObject({ cursorKind: 'key', propertyPath: ['backgroundColor'], existingKeys: ['base'] })
  })

  it("resolves the same outer property for the array form, e.g. backgroundColor: ['blue.500', 're']", () => {
    const source = `
      import { defineConfig, defineRecipe } from '@pandacss/dev'
      export default defineConfig({
        recipes: { button: defineRecipe({ base: { backgroundColor: ['blue.500', 're'] } }) },
      })
    `
    const position = source.lastIndexOf("'re'") + 2
    const info = getStyleObjectCursorInfo(parse(source), position)

    expect(info).toMatchObject({ cursorKind: 'value', propertyPath: ['backgroundColor'] })
  })

  it('resolves the outer property even when the conditional value nests further, e.g. sm: { md: "re" }', () => {
    const source = `
      import { defineConfig, defineRecipe } from '@pandacss/dev'
      export default defineConfig({
        recipes: { button: defineRecipe({ base: { backgroundColor: { sm: { md: 're' } } } }) },
      })
    `
    const position = source.lastIndexOf("'re'") + 2
    const info = getStyleObjectCursorInfo(parse(source), position)

    expect(info).toMatchObject({ cursorKind: 'value', propertyPath: ['backgroundColor', 'sm', 'md'] })
  })

  it("doesn't get style suggestions while filling in the recipe's own metadata, e.g. className", () => {
    const source = `
      import { defineConfig, defineRecipe } from '@pandacss/dev'
      export default defineConfig({
        recipes: { button: defineRecipe({ className: 'button', base: {} }) },
      })
    `
    const position = source.indexOf("'button'") + 2
    expect(getStyleObjectCursorInfo(parse(source), position)).toBeUndefined()
  })

  it('gets no suggestions while editing plain code with no style object nearby', () => {
    const source = 'const x = 1'
    expect(getStyleObjectCursorInfo(parse(source), 6)).toBeUndefined()
  })
})

describe('recognizing which define*() call the cursor is inside', () => {
  it('recognizes a defineRecipe(...) call and its argument', () => {
    const source = 'defineRecipe({ base: {} })'
    const sourceFile = parse(source)
    const position = source.lastIndexOf('{}')
    const node = (function findAt(root: ts.Node): ts.Node {
      let found = root
      root.forEachChild((child) => {
        if (position >= child.getStart() && position <= child.getEnd()) found = findAt(child)
      })
      return found
    })(sourceFile)

    const match = findEnclosingDefineCall(node)
    expect(match?.kind).toBe('recipe')
  })

  it('reports nothing when the cursor sits outside any define*() call', () => {
    const source = `
      import { defineConfig } from '@pandacss/dev'
      export default defineConfig({ globalCss: {} })
    `
    const sourceFile = parse(source)
    expect(findEnclosingDefineCall(sourceFile)).toBeUndefined()
  })
})

describe('a user editing semantic tokens', () => {
  it('gets category suggestions on an empty line inside defineSemanticTokens({...})', () => {
    const source = `
      import { defineConfig, defineSemanticTokens } from '@pandacss/dev'
      export default defineConfig({
        theme: { semanticTokens: defineSemanticTokens({  }) },
      })
    `
    const position = source.lastIndexOf('{  }') + 1
    const info = getSemanticTokenCursorInfo(parse(source), position)

    expect(info).toMatchObject({ cursorKind: 'category', existingKeys: [] })
  })

  it('excludes categories already used from the suggestion list', () => {
    const source = `
      import { defineConfig, defineSemanticTokens } from '@pandacss/dev'
      export default defineConfig({
        theme: { semanticTokens: defineSemanticTokens({ colors: {},  }) },
      })
    `
    const position = source.lastIndexOf(',  }') + 2
    const info = getSemanticTokenCursorInfo(parse(source), position)

    expect(info).toMatchObject({ cursorKind: 'category', existingKeys: ['colors'] })
  })

  it("gets condition suggestions inside a token's conditional value object", () => {
    const source = `
      import { defineConfig, defineSemanticTokens } from '@pandacss/dev'
      export default defineConfig({
        theme: {
          semanticTokens: defineSemanticTokens({
            colors: { danger: { value: {  } } },
          }),
        },
      })
    `
    const position = source.lastIndexOf('{  }') + 1
    const info = getSemanticTokenCursorInfo(parse(source), position)

    expect(info).toMatchObject({ cursorKind: 'condition', existingKeys: [] })
  })

  it('also gets condition suggestions nested inside another condition, e.g. _dark.sm', () => {
    const source = `
      import { defineConfig, defineSemanticTokens } from '@pandacss/dev'
      export default defineConfig({
        theme: {
          semanticTokens: defineSemanticTokens({
            colors: { danger: { value: { base: 'red', _dark: {  } } } },
          }),
        },
      })
    `
    const position = source.lastIndexOf('{  }') + 1
    const info = getSemanticTokenCursorInfo(parse(source), position)

    expect(info).toMatchObject({ cursorKind: 'condition', existingKeys: [] })
  })

  it('doesn\'t get suggestions while naming the token itself (e.g. "danger")', () => {
    const source = `
      import { defineConfig, defineSemanticTokens } from '@pandacss/dev'
      export default defineConfig({
        theme: { semanticTokens: defineSemanticTokens({ colors: { danger: { value: 'red' } } }) },
      })
    `
    const position = source.indexOf('danger') + 1
    expect(getSemanticTokenCursorInfo(parse(source), position)).toBeUndefined()
  })

  it('recognizes the per-category proxy form, defineSemanticTokens.colors({...})', () => {
    const source = `
      import { defineConfig, defineSemanticTokens } from '@pandacss/dev'
      export default defineConfig({
        theme: {
          semanticTokens: { colors: defineSemanticTokens.colors({ danger: { value: {  } } }) },
        },
      })
    `
    const position = source.lastIndexOf('{  }') + 1
    const info = getSemanticTokenCursorInfo(parse(source), position)

    expect(info).toMatchObject({ cursorKind: 'condition', existingKeys: [] })
  })

  it("doesn't offer category suggestions at the top level of the per-category proxy form", () => {
    const source = `
      import { defineConfig, defineSemanticTokens } from '@pandacss/dev'
      export default defineConfig({
        theme: { semanticTokens: { colors: defineSemanticTokens.colors({  }) } },
      })
    `
    const position = source.lastIndexOf('{  }') + 1
    expect(getSemanticTokenCursorInfo(parse(source), position)).toBeUndefined()
  })

  it("gets no suggestions if they haven't wrapped semantic tokens in defineSemanticTokens yet", () => {
    const source = `
      import { defineConfig } from '@pandacss/dev'
      export default defineConfig({ theme: { semanticTokens: { colors: {  } } } })
    `
    const position = source.lastIndexOf('{  }') + 1
    expect(getSemanticTokenCursorInfo(parse(source), position)).toBeUndefined()
  })
})

describe('getContainerPath', () => {
  it('describes where in the config tree an object literal lives, e.g. recipes.button.base', () => {
    const source = `
      import { defineConfig } from '@pandacss/dev'
      export default defineConfig({ recipes: { button: { base: {} } } })
    `
    const sourceFile = parse(source)
    const innerBraces = source.lastIndexOf('{}')
    const objectLiteral = (function findAt(root: ts.Node): ts.Node {
      let found = root
      root.forEachChild((child) => {
        if (innerBraces >= child.getStart() && innerBraces <= child.getEnd()) found = findAt(child)
      })
      return found
    })(sourceFile)

    expect(ts.isObjectLiteralExpression(objectLiteral)).toBe(true)
    expect(getContainerPath(objectLiteral)).toEqual(['recipes', 'button', 'base'])
  })
})
