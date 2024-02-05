import { createContext } from '@pandacss/fixture'
import { describe, expect, test } from 'vitest'

describe('file matcher', () => {
  test('imports', () => {
    const ctx = createContext()

    const file = ctx.imports.file([
      // import { css as xcss } from 'styled-system/css'
      { mod: 'styled-system/css', name: 'css', alias: 'xcss' },
      // import { cva } from 'styled-system/css'
      { mod: 'styled-system/css', name: 'cva', alias: 'cva' },
    ])

    expect(file.cvaAlias).toMatchInlineSnapshot('"cva"')

    expect(file.cssAlias).toMatchInlineSnapshot('"xcss"')
    expect(file.getAlias('css')).toMatchInlineSnapshot('"xcss"')
    expect(file.getName('xcss')).toMatchInlineSnapshot('"css"')
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
      { mod: 'styled-system/jsx', name: 'Stack', alias: 'Stack' },
      { mod: 'styled-system/jsx', name: 'VStack', alias: '__VStack' },
    ])

    expect(file.isJsxFactory('styled')).toMatchInlineSnapshot('true')
    expect(file.isJsxFactory('styled.div')).toMatchInlineSnapshot('true')
    expect(file.isJsxFactory('Comp')).toMatchInlineSnapshot('false')
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
    expect(file.isValidPattern('vstack')).toMatchInlineSnapshot('true')
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
    expect(file.isValidRecipe('button')).toMatchInlineSnapshot('true')

    expect(file.isValidRecipe('buttonStyle')).toMatchInlineSnapshot('true')
    expect(file.isValidRecipe('button')).toMatchInlineSnapshot('true')
    expect(file.isValidRecipe('xxxbutton')).toMatchInlineSnapshot('false')
  })

  test('is raw fn', () => {
    const ctx = createContext()

    const file = ctx.imports.file([
      { mod: 'styled-system/css', name: 'css', alias: 'xcss' },
      { mod: 'styled-system/css', name: 'cva', alias: 'cva' },
      { mod: 'styled-system/patterns', name: 'stack', alias: 'stack' },
    ])

    expect(file.isRawFn('css')).toMatchInlineSnapshot('true')
    expect(file.isRawFn('xcss')).toMatchInlineSnapshot('false')

    expect(file.isRawFn('css.raw')).toMatchInlineSnapshot('true')
    expect(file.isRawFn('stack.raw')).toMatchInlineSnapshot('true')

    expect(file.isRawFn('cva.raw')).toMatchInlineSnapshot('false')
  })
})
