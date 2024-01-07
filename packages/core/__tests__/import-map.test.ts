import { createContext } from '@pandacss/fixture'
import { describe, expect, test } from 'vitest'
import type { ImportResult } from '../src/file-matcher'

describe('import map', () => {
  test('value', () => {
    const ctx = createContext()
    expect(ctx.imports.value).toMatchInlineSnapshot(`
      {
        "css": "styled-system/css",
        "jsx": "styled-system/jsx",
        "pattern": "styled-system/patterns",
        "recipe": "styled-system/recipes",
      }
    `)
  })

  test('normalize', () => {
    const ctx = createContext({ importMap: '@acme/org' })
    expect(ctx.imports.value).toMatchInlineSnapshot(`
      {
        "css": "@acme/org/css",
        "jsx": "@acme/org/jsx",
        "pattern": "@acme/org/patterns",
        "recipe": "@acme/org/recipes",
      }
    `)
  })

  test('match', () => {
    const ctx = createContext()

    expect(ctx.imports.match({ mod: 'styled-system/css', alias: 'css', name: 'css' })).toBeTruthy()

    // incorrect module should not match
    expect(ctx.imports.match({ mod: 'anydir/css', alias: 'css', name: 'css' })).toBeFalsy()

    // ts paths
    expect(
      ctx.imports.match({ mod: 'anydir/css', alias: 'css', name: 'css' }, function resolveTsPath(mod) {
        return { 'anydir/css': 'styled-system/css' }[mod]
      }),
    ).toBeTruthy()
  })

  test('import file / valid', () => {
    const ctx = createContext()

    // all imports in a file
    const imports: ImportResult[] = [
      { mod: 'styled-system/css', alias: 'css', name: 'css' },
      { mod: 'styled-system/css', alias: 'sva', name: 'sva' },
    ]

    const file = ctx.imports.file(imports)

    expect(file.isEmpty()).toBeFalsy()
    expect(file.toString()).toMatchInlineSnapshot('"css, sva"')

    expect(file.find('css')).toBeTruthy()
    // cx is not imported
    expect(file.find('cx')).toBeFalsy()
  })

  test('import file / invalid', () => {
    const ctx = createContext()

    // all imports in a file
    const imports: ImportResult[] = [
      { mod: 'preact', alias: 'render', name: 'render' },
      { mod: './app', alias: 'App', name: 'App' },
    ]

    const file = ctx.imports.file(imports)

    // no imports for styled-system found
    expect(file.isEmpty()).toMatchInlineSnapshot('false')
    expect(file.toString()).toMatchInlineSnapshot('"render, App"')

    // css is not imported
    expect(file.find('css')).toBeFalsy()
    // cx is not imported
    expect(file.find('sx')).toBeFalsy()
  })
})
