import type { SerializedConfig } from '@pandacss/compiler-shared'
import { describe, expect, test } from 'vitest'
import { diffConfig } from '../src/diff'

const base: SerializedConfig = {
  outdir: 'styled-system',
  theme: {
    tokens: { colors: { red: { value: '#f00' } } },
    recipes: { button: { className: 'btn', base: { color: 'red' } } },
  },
  patterns: { stack: { properties: { gap: {} } } },
  conditions: { hover: '&:hover' },
  utilities: { color: { className: 'c', values: 'colors' } },
}

const clone = (config: SerializedConfig): SerializedConfig => structuredClone(config)

describe('diffConfig', () => {
  test('no previous config → full regen', () => {
    const result = diffConfig(undefined, base)
    expect(result.hasChanged).toBe(true)
    expect(result.dependencies).toMatchInlineSnapshot(`
      [
        "codegenFormat",
        "conditions",
        "hash",
        "jsxFactory",
        "jsxFramework",
        "jsxStyleProps",
        "patterns",
        "prefix",
        "recipes",
        "separator",
        "syntax",
        "themes",
        "tokens",
        "utilities",
      ]
    `)
  })

  test('identical config → no change', () => {
    const result = diffConfig(base, clone(base))
    expect(result.hasChanged).toBe(false)
    expect(result.dependencies).toEqual([])
  })

  test('token value change → tokens dependency', () => {
    const next = clone(base)
    ;(next.theme as any).tokens.colors.red.value = '#e00'
    const result = diffConfig(base, next)
    expect(result.dependencies).toMatchInlineSnapshot(`
      [
        "tokens",
      ]
    `)
  })

  test('recipe change → recipes dependency + recipe name', () => {
    const next = clone(base)
    ;(next.theme as any).recipes.button.base.color = 'blue'
    const result = diffConfig(base, next)
    expect(result.dependencies).toMatchInlineSnapshot(`
      [
        "recipes",
      ]
    `)
    expect(result.recipes).toMatchInlineSnapshot(`
      [
        "button",
      ]
    `)
  })

  test('pattern change → patterns dependency + pattern name', () => {
    const next = clone(base)
    ;(next.patterns as any).stack.properties.align = {}
    const result = diffConfig(base, next)
    expect(result.dependencies).toMatchInlineSnapshot(`
      [
        "patterns",
      ]
    `)
    expect(result.patterns).toMatchInlineSnapshot(`
      [
        "stack",
      ]
    `)
  })

  test('jsx + format changes → respective dependencies', () => {
    const next = clone(base)
    next.jsxFramework = 'react'
    next.syntax = 'template-literal'
    next.shorthands = false
    const result = diffConfig(base, next)
    expect(result.dependencies.sort()).toMatchInlineSnapshot(`
      [
        "codegenFormat",
        "jsxFramework",
        "syntax",
      ]
    `)
  })

  test('documented gap: a utility transform body edit is invisible (lowered to a stable ref)', () => {
    const prev: SerializedConfig = {
      utilities: { size: { transform: { kind: 'js-callback', id: 'utilities.size.transform' } } },
    }
    const next: SerializedConfig = {
      // same ref id even though the live function body differs
      utilities: { size: { transform: { kind: 'js-callback', id: 'utilities.size.transform' } } },
    }
    const result = diffConfig(prev, next)
    expect(result.hasChanged).toBe(false)
  })
})
