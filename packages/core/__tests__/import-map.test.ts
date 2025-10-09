import { createContext } from '@pandacss/fixture'
import { describe, expect, test } from 'vitest'
import type { ImportResult } from '../src/file-matcher'

describe('import map', () => {
  test('value', () => {
    const ctx = createContext()
    expect(ctx.imports.value).toMatchInlineSnapshot(`
      {
        "css": [
          "styled-system/css",
        ],
        "jsx": [
          "styled-system/jsx",
        ],
        "pattern": [
          "styled-system/patterns",
        ],
        "recipe": [
          "styled-system/recipes",
        ],
        "tokens": [
          "styled-system/tokens",
        ],
      }
    `)
  })

  test('partial value - has fallbacks', () => {
    const ctx = createContext({
      importMap: {
        jsx: ['styled-system/jsx', 'custom-entrypoint'],
      },
    })
    expect(ctx.imports.value).toMatchInlineSnapshot(`
      {
        "css": [
          "styled-system/css",
        ],
        "jsx": [
          "styled-system/jsx",
          "custom-entrypoint",
        ],
        "pattern": [
          "styled-system/patterns",
        ],
        "recipe": [
          "styled-system/recipes",
        ],
        "tokens": [
          "styled-system/tokens",
        ],
      }
    `)
  })

  test('normalize', () => {
    const ctx = createContext({ importMap: '@acme/org' })
    expect(ctx.imports.value).toMatchInlineSnapshot(`
      {
        "css": [
          "@acme/org/css",
        ],
        "jsx": [
          "@acme/org/jsx",
        ],
        "pattern": [
          "@acme/org/patterns",
        ],
        "recipe": [
          "@acme/org/recipes",
        ],
        "tokens": [
          "@acme/org/tokens",
        ],
      }
    `)
  })

  test('normalize - array', () => {
    const ctx = createContext({ importMap: ['@acme/org', '@foo/org', '@bar/org'] })
    expect(ctx.imports.value).toMatchInlineSnapshot(`
      {
        "css": [
          "@acme/org/css",
          "@foo/org/css",
          "@bar/org/css",
        ],
        "jsx": [
          "@acme/org/jsx",
          "@foo/org/jsx",
          "@bar/org/jsx",
        ],
        "pattern": [
          "@acme/org/patterns",
          "@foo/org/patterns",
          "@bar/org/patterns",
        ],
        "recipe": [
          "@acme/org/recipes",
          "@foo/org/recipes",
          "@bar/org/recipes",
        ],
        "tokens": [
          "@acme/org/tokens",
          "@foo/org/tokens",
          "@bar/org/tokens",
        ],
      }
    `)
  })

  test('normalize - object input with array and without jsx', () => {
    const ctx = createContext({
      importMap: {
        css: ['@acme/org/css', '@foo/org/css', '@bar/org/css'],
        recipes: '@acme/org/recipes',
        patterns: '@acme/org/patterns',
      },
    })
    expect(ctx.imports.value).toMatchInlineSnapshot(`
      {
        "css": [
          "@acme/org/css",
          "@foo/org/css",
          "@bar/org/css",
        ],
        "jsx": [
          "styled-system/jsx",
        ],
        "pattern": [
          "@acme/org/patterns",
        ],
        "recipe": [
          "@acme/org/recipes",
        ],
        "tokens": [
          "styled-system/tokens",
        ],
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
        if (mod === 'anydir/css') return `${ctx.config.cwd}/styled-system/css`
      }),
    ).toBeTruthy()
  })

  test('match - multiple sources', () => {
    const ctx = createContext({
      importMap: {
        css: ['@acme/org/css', '@foo/org/css', 'styled-system/css'],
        recipes: '@acme/org/recipes',
        patterns: '@acme/org/patterns',
      },
    })

    expect(ctx.imports.match({ mod: '@acme/org/css', alias: 'css', name: 'css' })).toBeTruthy()
    expect(ctx.imports.match({ mod: '@foo/org/css', alias: 'css', name: 'css' })).toBeTruthy()
    expect(ctx.imports.match({ mod: 'styled-system/css', alias: 'css', name: 'css' })).toBeTruthy()

    expect(ctx.imports.match({ mod: '@acme/org/recipes', alias: 'cardStyle', name: 'cardStyle' })).toBeTruthy()
    expect(ctx.imports.match({ mod: '@acme/org/patterns', alias: 'box', name: 'box' })).toBeTruthy()

    // incorrect module should not match
    expect(ctx.imports.match({ mod: '@wrong/org/css', alias: 'css', name: 'css' })).toBeFalsy()

    expect(ctx.imports.match({ mod: 'styled-system/recipes', alias: 'cardStyle', name: 'cardStyle' })).toBeFalsy()
    expect(ctx.imports.match({ mod: 'styled-system/patterns', alias: 'stack', name: 'stack' })).toBeFalsy()

    expect(ctx.imports.match({ mod: '@foo/org/recipes', alias: 'cardStyle', name: 'cardStyle' })).toBeFalsy()
    expect(ctx.imports.match({ mod: '@foo/org/patterns', alias: 'stack', name: 'stack' })).toBeFalsy()

    // ts paths
    expect(
      ctx.imports.match({ mod: 'anydir/css', alias: 'css', name: 'css' }, function resolveTsPath(mod) {
        if (mod === 'anydir/css') return `@acme/org/css`
      }),
    ).toBeTruthy()

    expect(
      ctx.imports.match({ mod: 'anydir/css', alias: 'css', name: 'css' }, function resolveTsPath(mod) {
        if (mod === 'anydir/css') return `${ctx.config.cwd}/styled-system/css`
      }),
    ).toBeTruthy()

    expect(
      ctx.imports.match({ mod: 'anydir/css', alias: 'css', name: 'css' }, function resolveTsPath(mod) {
        if (mod === 'anydir/css') return `@wrong/org/css`
      }),
    ).toBeFalsy()
  })

  test('match - multiple importMap', () => {
    const ctx = createContext({
      importMap: ['@acme/org', '@foo/org', 'styled-system'],
    })

    expect(ctx.imports.match({ mod: '@foo/org/css', alias: 'css', name: 'css' })).toBeTruthy()
    expect(ctx.imports.match({ mod: '@foo/org/recipes', alias: 'cardStyle', name: 'cardStyle' })).toBeTruthy()
    expect(ctx.imports.match({ mod: '@foo/org/patterns', alias: 'stack', name: 'stack' })).toBeTruthy()

    expect(ctx.imports.match({ mod: 'styled-system/css', alias: 'css', name: 'css' })).toBeTruthy()
    expect(ctx.imports.match({ mod: 'styled-system/recipes', alias: 'cardStyle', name: 'cardStyle' })).toBeTruthy()
    expect(ctx.imports.match({ mod: 'styled-system/patterns', alias: 'stack', name: 'stack' })).toBeTruthy()

    expect(ctx.imports.match({ mod: '@wrong/org/css', alias: 'css', name: 'css' })).toBeFalsy()
    expect(ctx.imports.match({ mod: '@wrong/org/recipes', alias: 'cardStyle', name: 'cardStyle' })).toBeFalsy()
    expect(ctx.imports.match({ mod: '@wrong/org/patterns', alias: 'box', name: 'box' })).toBeFalsy()

    // incorrect module should not match
    expect(ctx.imports.match({ mod: '@wrong/org/css', alias: 'css', name: 'css' })).toBeFalsy()

    // ts paths
    expect(
      ctx.imports.match({ mod: 'anydir/css', alias: 'css', name: 'css' }, function resolveTsPath(mod) {
        if (mod === 'anydir/css') return `@acme/org/css`
      }),
    ).toBeTruthy()

    expect(
      ctx.imports.match({ mod: 'anydir/css', alias: 'css', name: 'css' }, function resolveTsPath(mod) {
        if (mod === 'anydir/css') return `${ctx.config.cwd}/styled-system/css`
      }),
    ).toBeTruthy()

    expect(
      ctx.imports.match({ mod: 'anydir/css', alias: 'css', name: 'css' }, function resolveTsPath(mod) {
        if (mod === 'anydir/css') return `@wrong/org/css`
      }),
    ).toBeFalsy()
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

describe('import map - outdir', () => {
  test('default', () => {
    const ctx = createContext()
    expect(ctx.imports.outdir).toMatchInlineSnapshot('"styled-system"')
  })

  test('relative outdir', () => {
    const ctx = createContext({
      cwd: '/Users/astahmer/dev/open-source/panda-app',
      outdir: './styled-system',
    })
    expect(ctx.imports.outdir).toMatchInlineSnapshot(`"styled-system"`)
  })

  test('with baseUrl', () => {
    const ctx = createContext({
      cwd: '/Users/astahmer/dev/open-source/panda-app',
      outdir: 'styled-system',
      tsconfig: {
        compilerOptions: {
          baseUrl: '.',
        },
      },
    })
    expect(ctx.imports.outdir).toMatchInlineSnapshot(`"styled-system"`)
  })

  test('with baseUrl - relative outdir', () => {
    const ctx = createContext({
      cwd: '/Users/astahmer/dev/open-source/panda-app',
      outdir: '../styled-system',
      tsconfig: {
        compilerOptions: {
          baseUrl: '.',
        },
      },
    })
    expect(ctx.imports.outdir).toMatchInlineSnapshot(`"styled-system"`)
  })

  test('with baseUrl - parent outdir', () => {
    const ctx = createContext({
      cwd: '/Users/astahmer/dev/open-source/panda-app',
      outdir: '../styled-system',
      tsconfig: {
        compilerOptions: {
          baseUrl: '.',
        },
      },
    })
    expect(ctx.imports.outdir).toMatchInlineSnapshot(`"styled-system"`)
  })

  test('with baseUrl - nested parent outdir', () => {
    const ctx = createContext({
      cwd: '/Users/astahmer/dev/open-source/panda-app',
      outdir: '../../../styled-system',
      tsconfig: {
        compilerOptions: {
          baseUrl: '.',
        },
      },
    })
    expect(ctx.imports.outdir).toMatchInlineSnapshot(`"styled-system"`)
  })

  test('with baseUrl - ./src', () => {
    const ctx = createContext({
      cwd: '/Users/astahmer/dev/open-source/panda-app',
      outdir: 'styled-system',
      tsconfig: {
        compilerOptions: {
          baseUrl: './src',
        },
      },
    })
    expect(ctx.imports.outdir).toMatchInlineSnapshot(`"styled-system"`)
  })

  test('with baseUrl - ./src - relative outdir', () => {
    const ctx = createContext({
      cwd: '/Users/astahmer/dev/open-source/panda-app',
      outdir: '../styled-system',
      tsconfig: {
        compilerOptions: {
          baseUrl: './src',
        },
      },
    })
    expect(ctx.imports.outdir).toMatchInlineSnapshot(`"styled-system"`)
  })

  test('with baseUrl - ./src - parent outdir', () => {
    const ctx = createContext({
      cwd: '/Users/astahmer/dev/open-source/panda-app',
      outdir: '../styled-system',
      tsconfig: {
        compilerOptions: {
          baseUrl: './src',
        },
      },
    })
    expect(ctx.imports.outdir).toMatchInlineSnapshot(`"styled-system"`)
  })

  test('with baseUrl - ./src - nested parent outdir', () => {
    const ctx = createContext({
      cwd: '/Users/astahmer/dev/open-source/panda-app',
      outdir: '../../../styled-system',
      tsconfig: {
        compilerOptions: {
          baseUrl: './src',
        },
      },
    })
    expect(ctx.imports.outdir).toMatchInlineSnapshot(`"styled-system"`)
  })
})
