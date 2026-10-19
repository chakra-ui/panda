import type { Compiler, NativeSourceTransformer, TransformSourceResult } from '@pandacss/compiler-shared'
import { describe, expect, it, vi } from 'vitest'
import { runSourceTransform } from '../src/hooks'
import { INTERNAL_CSS_IMPORT, INTERNAL_CSS_RESOLVED_ID } from '../src/runtime/internal/ids'
import { createSourceTransformer, shouldTransform, stripVueBlockQuery, transformSource } from '../src/transform'

describe('shouldTransform', () => {
  it('matches source files and ignores assets', () => {
    expect(shouldTransform('/project/src/App.tsx')).toMatchInlineSnapshot(`true`)
    expect(shouldTransform('/project/src/App.tsx?import')).toMatchInlineSnapshot(`true`)
    expect(shouldTransform('/project/src/styles.css')).toMatchInlineSnapshot(`false`)
    expect(shouldTransform('/project/logo.png')).toMatchInlineSnapshot(`false`)
  })

  it('matches svelte, vue and astro components but not their sub-requests', () => {
    expect(shouldTransform('/project/src/routes/+page.svelte')).toMatchInlineSnapshot(`true`)
    expect(shouldTransform('/project/src/App.vue')).toMatchInlineSnapshot(`true`)
    expect(shouldTransform('/project/src/pages/index.astro')).toMatchInlineSnapshot(`true`)
    expect(shouldTransform('/project/src/App.svelte?svelte&type=style&lang.css')).toMatchInlineSnapshot(`false`)
    expect(shouldTransform('/project/src/App.vue?vue&type=style&index=0&scoped=true&lang.css')).toMatchInlineSnapshot(
      `false`,
    )
    expect(shouldTransform('/project/src/Card.astro?astro&type=script&index=0&lang.ts')).toMatchInlineSnapshot(`false`)
  })

  it('strips vue-loader block queries without touching other resource queries', () => {
    expect(stripVueBlockQuery('/project/src/App.vue?vue&type=script&setup=true&lang=js')).toMatchInlineSnapshot(
      `"/project/src/App.vue"`,
    )
    expect(stripVueBlockQuery('/project/src/App.vue?vue&type=style&index=0')).toMatchInlineSnapshot(
      `"/project/src/App.vue"`,
    )
    expect(stripVueBlockQuery('/project/src/App.vue?vue&type=custom&index=0')).toMatchInlineSnapshot(
      `"/project/src/App.vue"`,
    )
    expect(stripVueBlockQuery('/project/src/App.vue?raw')).toMatchInlineSnapshot(`"/project/src/App.vue?raw"`)
    expect(stripVueBlockQuery('/project/src/App.vue?url')).toMatchInlineSnapshot(`"/project/src/App.vue?url"`)
    expect(stripVueBlockQuery('/project/src/App.vue?vue')).toMatchInlineSnapshot(`"/project/src/App.vue?vue"`)
    expect(stripVueBlockQuery('/project/src/App.vue?type=style&vue')).toMatchInlineSnapshot(
      `"/project/src/App.vue?type=style&vue"`,
    )
    expect(stripVueBlockQuery('/project/src/App.vue?raw&vue&type=style')).toMatchInlineSnapshot(
      `"/project/src/App.vue?raw&vue&type=style"`,
    )
    expect(stripVueBlockQuery('/project/src/App.vue?vue=false&type=script')).toMatchInlineSnapshot(
      `"/project/src/App.vue?vue=false&type=script"`,
    )
    expect(stripVueBlockQuery('/project/src/App.vue?vue&type=other')).toMatchInlineSnapshot(
      `"/project/src/App.vue?vue&type=other"`,
    )
    expect(stripVueBlockQuery('/project/src/App.svelte?svelte&type=style')).toMatchInlineSnapshot(
      `"/project/src/App.svelte?svelte&type=style"`,
    )
    expect(shouldTransform(stripVueBlockQuery('/project/src/App.vue?raw'))).toBe(false)
    expect(shouldTransform(stripVueBlockQuery('/project/src/App.vue?vue&type=template'))).toBe(true)
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
        helper: { needsCx: false, needsAttachRecipe: false, needsMemoRecipe: false },
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
          "needsAttachRecipe": false,
          "needsCx": false,
          "needsMemoRecipe": false,
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
        helper: { needsCx: false, needsAttachRecipe: false, needsMemoRecipe: false },
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
          "needsAttachRecipe": false,
          "needsCx": false,
          "needsMemoRecipe": false,
        },
        "map": null,
      }
    `)
  })
})

describe('runSourceTransform', () => {
  it('returns warnings when a static call cannot be rewritten', () => {
    const diagnostic: TransformSourceResult['diagnostics'][number] = {
      code: 'nested_property',
      severity: 'warning',
      message: 'Use a selector instead.',
    }
    const source = "css({ has: { svg: { color: 'red' } } })"
    const compiler = {
      transformSource: vi.fn(() => ({
        code: source,
        map: null,
        changed: false,
        bailed: true,
        diagnostics: [diagnostic],
        dependencies: [],
        helper: { needsCx: false, needsAttachRecipe: false, needsMemoRecipe: false },
      })),
    } as unknown as Compiler

    expect(runSourceTransform({}, { compiler }, source, '/project/App.tsx')).toEqual({
      code: source,
      map: null,
      changed: false,
      bailed: true,
      diagnostics: [diagnostic],
      dependencies: [],
    })
  })

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
        helper: { needsCx: false, needsAttachRecipe: false, needsMemoRecipe: false },
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
