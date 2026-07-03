import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { findEnclosingDefineCall, getContainerPath, getStyleObjectCursorInfo } from '../src/service/ast'

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

    expect(info).toMatchObject({ cursorKind: 'value', propertyName: 'color', existingKeys: ['color'] })
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

    expect(info).toMatchObject({ cursorKind: 'value', propertyName: 'color' })
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

    expect(info).toMatchObject({ cursorKind: 'value', propertyName: 'color' })
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
