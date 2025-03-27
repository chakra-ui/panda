import { createContext } from '@pandacss/fixture'
import { describe, expect, test } from 'vitest'

describe('file matcher', () => {
  test('imports', () => {
    const ctx = createContext()

    const file = ctx.imports.file([
      { mod: 'styled-system/css', name: 'css', alias: 'css' },
      // import { css as xcss } from 'styled-system/css'
      { mod: 'styled-system/css', name: 'css', alias: 'xcss' },
      // import { cva } from 'styled-system/css'
      { mod: 'styled-system/css', name: 'cva', alias: 'cva' },
    ])

    expect(file.getAliases('cva')).toMatchInlineSnapshot(`
      [
        "cva",
      ]
    `)
    expect(file.getAliases('css')).toMatchInlineSnapshot(`
      [
        "css",
        "xcss",
      ]
    `)
    expect(file.getName('xcss')).toMatchInlineSnapshot('"css"')
  })

  test('imports - multiple sources', () => {
    const ctx = createContext({ importMap: ['styled-system', '@acme/org'] })

    const file = ctx.imports.file([
      { mod: 'styled-system/css', name: 'cva', alias: 'cva' },
      { mod: 'styled-system/patterns', name: 'stack', alias: 'stack' },
      { mod: '@acme/org/css', name: 'cva', alias: 'cvaAcme' },
      { mod: '@acme/org/patterns', name: 'stack', alias: 'stackAcme' },

      { mod: '@wrong/org/css', name: 'cva', alias: 'cvaWrong' },
      { mod: '@wrong/org/patterns', name: 'stack', alias: 'stackWrong' },
    ])

    expect(file.matchFn('cva')).toMatchInlineSnapshot('true')
    expect(file.matchFn('cvaAcme')).toMatchInlineSnapshot('true')
    expect(file.isValidPattern('stack')).toMatchInlineSnapshot('true')
    expect(file.isValidPattern('stackAcme')).toMatchInlineSnapshot('true')

    expect(file.isValidPattern('randxxx')).toMatchInlineSnapshot('false')
    expect(file.matchFn('cvaWrong')).toMatchInlineSnapshot(`false`)
    expect(file.matchFn('stackWrong')).toMatchInlineSnapshot(`false`)
  })

  test('isPandaComponent', () => {
    const ctx = createContext()

    const file = ctx.imports.file([
      { mod: 'styled-system/jsx', name: 'Stack', alias: 'Stack' },
      { mod: 'styled-system/jsx', name: 'VStack', alias: '__VStack' },
    ])

    expect(file.isPandaComponent('Stack')).toMatchInlineSnapshot('true')
    // should match arbitrary tag names (so we can track style props)
    expect(file.isPandaComponent('RandomJsx')).toMatchInlineSnapshot(`false`)
    expect(file.isPandaComponent('random')).toMatchInlineSnapshot('false')
  })

  test('match tag', () => {
    const ctx = createContext()

    const file = ctx.imports.file([
      { mod: 'styled-system/jsx', name: 'Stack', alias: 'Stack' },
      { mod: 'styled-system/jsx', name: 'VStack', alias: '__VStack' },
    ])

    expect(file.matchTag('Stack')).toMatchInlineSnapshot('true')
    // should match arbitrary tag names (so we can track style props)
    expect(file.matchTag('RandomJsx')).toMatchInlineSnapshot('true')
    expect(file.matchTag('random')).toMatchInlineSnapshot('false')
  })

  test('is jsx factory', () => {
    const ctx = createContext()

    const file = ctx.imports.file([
      { mod: 'styled-system/jsx', name: 'styled', alias: 'styled' },
      { mod: 'styled-system/jsx', name: 'Stack', alias: 'Stack' },
      { mod: 'styled-system/jsx', name: 'VStack', alias: '__VStack' },
    ])

    expect(file.isJsxFactory('styled')).toMatchInlineSnapshot(`true`)
    expect(file.isJsxFactory('styled.div')).toMatchInlineSnapshot(`true`)
    expect(file.isJsxFactory('Comp')).toMatchInlineSnapshot(`undefined`)
  })

  test('is valid pattern', () => {
    // works because we have patterns loaded in the context (via preset-base)
    const ctx = createContext()

    const file = ctx.imports.file([
      { mod: 'styled-system/patterns', name: 'stack', alias: 'stack' },
      { mod: 'styled-system/patterns', name: 'vstack', alias: '__vstack' },
    ])

    expect(file.isValidPattern('randxxx')).toMatchInlineSnapshot('false')
    expect(file.isValidPattern('stack')).toMatchInlineSnapshot('true')

    expect(file.isValidPattern('__vstack')).toMatchInlineSnapshot('true')
    expect(file.isValidPattern('vstack')).toMatchInlineSnapshot('false') // This shouldnt match vstack is aliased as __vstack
  })

  test('is valid recipe', () => {
    const ctx = createContext({
      theme: {
        extend: {
          recipes: {
            button: {},
            badge: {},
          },
        },
      },
    })

    const file = ctx.imports.file([
      { mod: 'styled-system/recipes', name: 'badge', alias: 'badge' },
      { mod: 'styled-system/recipes', name: 'button', alias: 'buttonStyle' },
    ])

    expect(file.isValidRecipe('randxxx')).toMatchInlineSnapshot('false')
    expect(file.isValidRecipe('button')).toMatchInlineSnapshot('false') // this shouldnt match button is aliased as buttonStyle

    expect(file.isValidRecipe('buttonStyle')).toMatchInlineSnapshot('true')
    expect(file.isValidRecipe('button')).toMatchInlineSnapshot('false') // Redundant test?
    expect(file.isValidRecipe('xxxbutton')).toMatchInlineSnapshot('false')
  })

  test('is raw fn', () => {
    const ctx = createContext()

    const file = ctx.imports.file([
      { mod: 'other-system/css', name: 'css', alias: 'css' },
      { mod: 'styled-system/css', name: 'css', alias: 'xcss' },
      { mod: 'styled-system/css', name: 'cva', alias: 'cva' },
      { mod: 'styled-system/patterns', name: 'stack', alias: 'stack' },
      { mod: 'styled-system/patterns', name: 'grid', alias: 'aliasedGrid' },
    ])

    expect(file.isRawFn('css')).toMatchInlineSnapshot('false')
    expect(file.isRawFn('xcss')).toMatchInlineSnapshot('true')

    expect(file.isRawFn('css.raw')).toMatchInlineSnapshot('false')
    expect(file.isRawFn('xcss.raw')).toMatchInlineSnapshot('true')

    expect(file.isRawFn('stack.raw')).toMatchInlineSnapshot('true')

    expect(file.isRawFn('card.raw')).toMatchInlineSnapshot('false')
    expect(file.isRawFn('aliasedGrid.raw')).toMatchInlineSnapshot('true')

    expect(file.isRawFn('cva.raw')).toMatchInlineSnapshot('false')
  })

  test('namespace', () => {
    const ctx = createContext()

    // import * as p from 'styled-system/patterns'
    const file = ctx.imports.file([{ mod: 'styled-system/patterns', name: 'p', alias: 'p', kind: 'namespace' }])

    expect(file.isValidPattern('p.stack')).toMatchInlineSnapshot(`true`)
    expect(file.isValidPattern('p.grid')).toMatchInlineSnapshot(`true`)
  })
})
