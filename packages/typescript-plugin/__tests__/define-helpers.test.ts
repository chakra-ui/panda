import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { findEnclosingStringLiteral, getStyleObjectCursorInfo } from '../src/service/ast'
import { findConfigTokenRefAt } from '@pandacss/compiler/tooling'

function parse(source: string) {
  return ts.createSourceFile('panda.config.ts', source, ts.ScriptTarget.Latest, true)
}

// `defineConfig`/`defineRecipe`/`defineGlobalStyles`/etc. are all identity functions
// at runtime (see packages/dev/src/config.ts) — they exist purely for type inference,
// so a real panda.config.ts is written wrapped in these calls, nested inside each
// other, not as one bare object literal. These tests use that full realistic shape.
describe('a user editing a real, fully-wrapped panda.config.ts', () => {
  it('gets suggestions inside recipes.button.base even though it sits under defineConfig + theme + recipes', () => {
    const source = `
      import { defineConfig, defineRecipe } from '@pandacss/dev'
      export default defineConfig({
        theme: {
          recipes: {
            button: defineRecipe({ base: { color: 'red.500' } }),
          },
        },
      })
    `
    const position = source.indexOf("'red.500'") + 2

    const info = getStyleObjectCursorInfo(parse(source), position)
    expect(info).toMatchObject({ cursorKind: 'value', propertyName: 'color' })
  })

  it('gets suggestions inside a global style rule even though it sits under defineConfig', () => {
    const source = `
      import { defineConfig, defineGlobalStyles } from '@pandacss/dev'
      export default defineConfig({
        globalCss: defineGlobalStyles({ html: { color: 'red.500' } }),
      })
    `
    const position = source.indexOf("'red.500'") + 2

    const info = getStyleObjectCursorInfo(parse(source), position)
    expect(info).toMatchObject({ cursorKind: 'value', propertyName: 'color' })
  })

  it("doesn't get style suggestions while typing the selector name itself, only inside its rule", () => {
    const source = `
      import { defineConfig, defineGlobalStyles } from '@pandacss/dev'
      export default defineConfig({
        globalCss: defineGlobalStyles({ html: { color: 'red.500' } }),
      })
    `
    const position = source.indexOf('html') + 1

    expect(getStyleObjectCursorInfo(parse(source), position)).toBeUndefined()
  })

  it('gets token-path suggestions inside a semantic token reference, no wrapper required', () => {
    const source = `
      import { defineConfig } from '@pandacss/dev'
      export default defineConfig({
        theme: {
          semanticTokens: {
            colors: { danger: { value: '{colors.red.500}' } },
          },
        },
      })
    `
    const sourceFile = parse(source)
    const position = source.indexOf('colors.red.500') + 3

    const literal = findEnclosingStringLiteral(sourceFile, position)
    expect(literal).toBeDefined()
    const ref = literal && findConfigTokenRefAt(literal.text, position - (literal.getStart() + 1))
    expect(ref?.path).toBe('colors.red.500')
  })
})
