import type { Compiler, NativeSourceTransformer, TransformSourceResult } from '@pandacss/compiler-shared'
import { describe, expect, it, vi } from 'vitest'
import { runSourceTransform } from '../src/hooks'
import { INTERNAL_CSS_IMPORT, INTERNAL_CSS_RESOLVED_ID } from '../src/runtime/internal/ids'
import { createSourceTransformer, shouldTransform, transformSource } from '../src/transform'

describe('shouldTransform', () => {
  it('matches source files and ignores assets', () => {
    expect(shouldTransform('/project/src/App.tsx')).toMatchInlineSnapshot(`true`)
    expect(shouldTransform('/project/src/App.tsx?import')).toMatchInlineSnapshot(`true`)
    expect(shouldTransform('/project/src/styles.css')).toMatchInlineSnapshot(`false`)
    expect(shouldTransform('/project/logo.png')).toMatchInlineSnapshot(`false`)
  })

  it('respects include and exclude patterns', () => {
    expect(
      shouldTransform('/project/src/App.tsx', {
        include: [/\.css\.ts$/],
      }),
    ).toMatchInlineSnapshot(`false`)

    expect(
      shouldTransform('/project/src/button.css.ts', {
        include: [/\.css\.ts$/],
      }),
    ).toMatchInlineSnapshot(`true`)

    expect(
      shouldTransform('/project/node_modules/pkg/index.js', {
        exclude: [/node_modules/],
      }),
    ).toMatchInlineSnapshot(`false`)
  })
})

describe('transformSource', () => {
  it('delegates to the compiler binding', () => {
    const compiler = {
      transformSource: vi.fn(() => ({
        code: '"color_red"',
        map: null,
        changed: true,
        bailed: false,
        diagnostics: [],
        dependencies: ['/project/tokens.ts'],
        helper: { needsCx: false, needsCva: false, needsSva: false },
      })),
    } as NativeSourceTransformer

    const result = transformSource({
      compiler: compiler as unknown as Compiler,
      path: '/project/App.tsx',
      source: "css({ color: 'red' })",
    })

    expect(compiler.transformSource).toHaveBeenCalledWith({
      path: '/project/App.tsx',
      source: "css({ color: 'red' })",
      mode: undefined,
      helperCx: 'auto',
      targetsCss: undefined,
      targetsPatterns: undefined,
      targetsRecipes: undefined,
      targetsTokens: undefined,
      targetsJsx: undefined,
    })
    expect(result).toMatchInlineSnapshot(`
      {
        "bailed": false,
        "changed": true,
        "code": ""color_red"",
        "dependencies": [
          "/project/tokens.ts",
        ],
        "diagnostics": [],
        "helper": {
          "needsCva": false,
          "needsCx": false,
          "needsSva": false,
        },
        "map": null,
      }
    `)
  })

  it('supports object input through a reusable source transformer', () => {
    const compiler = {
      transformSource: vi.fn(() => ({
        code: '"color_blue"',
        map: null,
        changed: true,
        bailed: false,
        diagnostics: [],
        dependencies: [],
        helper: { needsCx: false, needsCva: false, needsSva: false },
      })),
    } as NativeSourceTransformer

    const transformer = createSourceTransformer(compiler as unknown as Compiler)

    expect(
      transformer.transformSource({
        path: '/project/App.tsx',
        source: "css({ color: 'blue' })",
        targets: { css: true, jsx: true },
      }),
    ).toMatchInlineSnapshot(`
      {
        "bailed": false,
        "changed": true,
        "code": ""color_blue"",
        "dependencies": [],
        "diagnostics": [],
        "helper": {
          "needsCva": false,
          "needsCx": false,
          "needsSva": false,
        },
        "map": null,
      }
    `)
  })
})

describe('runSourceTransform', () => {
  it('returns diagnostics alongside transformed output and registers dependencies', () => {
    const addWatchFile = vi.fn()
    const diagnostic: TransformSourceResult['diagnostics'][number] = {
      code: 'panda-test',
      severity: 'warning',
      message: 'watch this transform',
    }
    const compiler = {
      transformSource: vi.fn(() => ({
        code: '"color_red"',
        map: 'test-map',
        changed: true,
        bailed: false,
        diagnostics: [diagnostic],
        dependencies: ['/project/tokens.ts'],
        helper: { needsCx: false, needsCva: false, needsSva: false },
      })),
    } as unknown as Compiler

    const result = runSourceTransform({ addWatchFile }, { compiler }, "css({ color: 'red' })", '/project/App.tsx')

    expect(addWatchFile.mock.calls).toMatchInlineSnapshot(`
      [
        [
          "/project/tokens.ts",
        ],
      ]
    `)
    expect(result).toMatchInlineSnapshot(`
      {
        "bailed": false,
        "changed": true,
        "code": ""color_red"",
        "dependencies": [
          "/project/tokens.ts",
        ],
        "diagnostics": [
          {
            "code": "panda-test",
            "message": "watch this transform",
            "severity": "warning",
          },
        ],
        "map": "test-map",
      }
    `)
  })
})

describe('virtual internal css ids', () => {
  it('uses stable internal import and resolved ids', () => {
    expect(INTERNAL_CSS_IMPORT).toMatchInlineSnapshot(`"@pandacss-internal/css"`)
    expect(INTERNAL_CSS_RESOLVED_ID.startsWith('\0pandacss:internal:css')).toBe(true)
  })
})
