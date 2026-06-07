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
        "codegenImportExtensions",
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

  test('container scale change → token and condition dependencies', () => {
    const next = clone(base)
    ;(next.theme as any).containers = { md: '32rem' }
    const result = diffConfig(base, next)
    expect(result.dependencies).toMatchInlineSnapshot(`
      [
        "tokens",
        "conditions",
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

  test('jsx + codegen option changes → respective dependencies', () => {
    const next = clone(base)
    next.jsxFramework = 'react'
    next.syntax = 'template-literal'
    next.shorthands = false
    next.codegenImportExtensions = true
    const result = diffConfig(base, next)
    expect(result.dependencies.sort()).toMatchInlineSnapshot(`
      [
        "codegenFormat",
        "codegenImportExtensions",
        "jsxFramework",
        "syntax",
      ]
    `)
  })

  test('a utility transform body edit is visible via the callback ref hash', () => {
    const prev: SerializedConfig = {
      utilities: { size: { transform: { kind: 'js-callback', id: 'utilities.size.transform', hash: 'fn1-aaa' } } },
    }
    const next: SerializedConfig = {
      // same id, different hash — the body changed
      utilities: { size: { transform: { kind: 'js-callback', id: 'utilities.size.transform', hash: 'fn1-bbb' } } },
    }
    const result = diffConfig(prev, next)
    expect(result.hasChanged).toBe(true)
    expect(result.dependencies).toContain('utilities')
  })

  test('an unchanged utility transform (same ref hash) is not a change', () => {
    const ref = { kind: 'js-callback', id: 'utilities.size.transform', hash: 'fn1-aaa' } as const
    const prev: SerializedConfig = { utilities: { size: { transform: { ...ref } } } }
    const next: SerializedConfig = { utilities: { size: { transform: { ...ref } } } }
    expect(diffConfig(prev, next).hasChanged).toBe(false)
  })
})
