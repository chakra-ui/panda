import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { createCompiler, createCompilerFromWasmModule, loadWasm } from '../src'
import type { Atom, ExtractResult, PatternHelpers } from '../src'

const PKG_NODE = resolve(__dirname, '..', 'pkg-node', 'compiler_wasm.js')
const wasmAvailable = existsSync(PKG_NODE)

// Skip the suite if the wasm bundle hasn't been built. The CI / dev
// workflow is: `pnpm --filter @pandacss/compiler-wasm build:wasm` first,
// then run tests.
const describeIfBuilt = wasmAvailable ? describe : describe.skip

// Shared virtual config — the public `createCompiler` derives matchers from a
// config (not hand-built matchers), so the extraction/project tests build one
// compiler from this and the callback tests spread their utilities/patterns in.
const baseConfig = {
  cwd: '/virtual',
  outdir: 'styled-system',
  importMap: {
    css: ['@panda/css'],
    recipe: ['@panda/recipes'],
    pattern: ['@panda/patterns'],
    jsx: ['@panda/jsx'],
    tokens: ['@panda/tokens'],
  },
  jsxFactory: 'styled',
}

/// Strip span offsets from a result so snapshots don't churn when the
/// source string changes whitespace. Use when the test is about extraction
/// shape (calls/jsx/data) rather than precise byte locations.
function withoutSpans(result: ExtractResult): unknown {
  return {
    calls: result.calls.map(({ span: _span, ...rest }) => rest),
    jsx: result.jsx.map(({ span: _span, ...rest }) => rest),
    diagnostics: result.diagnostics.map((d) => ({
      message: d.message,
      severity: d.severity,
    })),
  }
}

describeIfBuilt('@pandacss/compiler-wasm', () => {
  describe('WasmFileSystem', () => {
    it('round-trips file content', async () => {
      const { WasmFileSystem } = await loadWasm()
      const fs = new WasmFileSystem()
      fs.addFile('/src/Button.tsx', 'const x = 1;')
      expect(fs.exists('/src/Button.tsx')).toBe(true)
      expect(fs.readFile('/src/Button.tsx')).toBe('const x = 1;')
      expect(fs.fileCount()).toBe(1)
    })

    it('removeFile drops the entry', async () => {
      const { WasmFileSystem } = await loadWasm()
      const fs = new WasmFileSystem()
      fs.addFile('/a.ts', 'x')
      expect(fs.removeFile('/a.ts')).toBe(true)
      expect(fs.exists('/a.ts')).toBe(false)
      expect(fs.removeFile('/a.ts')).toBe(false)
    })

    it('glob matches across the in-memory tree', async () => {
      const { WasmFileSystem } = await loadWasm()
      const fs = new WasmFileSystem()
      fs.addFile('/proj/src/Button.tsx', '')
      fs.addFile('/proj/src/helpers.ts', '')
      fs.addFile('/proj/src/types.d.ts', '')
      fs.addFile('/proj/node_modules/lib/index.js', '')

      const results = fs.glob({
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['**/node_modules/**'],
        cwd: '/proj',
        absolute: true,
      })
      results.sort()

      // Snapshot the full match list so the include/exclude interaction is
      // visible in the test. Note: explicit `exclude` disables the default
      // `**/*.d.ts` rule, so types.d.ts is included here.
      expect(results).toMatchInlineSnapshot(`
        [
          "/proj/src/Button.tsx",
          "/proj/src/helpers.ts",
          "/proj/src/types.d.ts",
        ]
      `)
    })

    it('default exclude (empty user exclude) drops .d.ts', async () => {
      const { WasmFileSystem } = await loadWasm()
      const fs = new WasmFileSystem()
      fs.addFile('/proj/main.ts', '')
      fs.addFile('/proj/types.d.ts', '')
      const results = fs.glob({
        include: ['**/*.ts'],
        cwd: '/proj',
      })
      expect(results).toMatchInlineSnapshot(`
        [
          "/proj/main.ts",
        ]
      `)
    })
  })

  describe('compiler.extract', () => {
    it('extracts a css() call to a literal object', async () => {
      const { compiler } = await createCompiler(baseConfig)
      const raw = compiler.extract(
        `import { css } from '@panda/css';\ncss({ color: 'red', bg: 'blue' });\n`,
        '/src/code.tsx',
      )
      expect(withoutSpans(raw as ExtractResult)).toMatchInlineSnapshot(`
        {
          "calls": [
            {
              "category": "css",
              "name": "css",
              "alias": "css",
              "data": [
                {
                  "color": "red",
                  "bg": "blue",
                },
              ],
            },
          ],
          "jsx": [],
          "diagnostics": [],
        }
      `)
    })

    it('extracts a <styled.div> JSX usage', async () => {
      const { compiler } = await createCompiler(baseConfig)
      const raw = compiler.extract(
        `import { styled } from '@panda/jsx';\nconst X = () => <styled.div color="red" />;\n`,
        '/src/code.tsx',
      )
      expect(withoutSpans(raw as ExtractResult)).toMatchInlineSnapshot(`
        {
          "calls": [],
          "jsx": [
            {
              "category": "jsx",
              "name": "styled.div",
              "alias": "styled",
              "data": {
                "color": "red",
              },
            },
          ],
          "diagnostics": [],
        }
      `)
    })

    it('cross-file imports fold through the shared memory FS', async () => {
      const { fs, compiler } = await createCompiler(baseConfig)
      fs.addFile('/proj/tokens.ts', "export const brand = '#ef4444';\n")
      const raw = compiler.extract(
        `import { brand } from './tokens';\nimport { css } from '@panda/css';\ncss({ color: brand });\n`,
        '/proj/main.tsx',
      )
      expect(withoutSpans(raw as ExtractResult)).toMatchInlineSnapshot(`
        {
          "calls": [
            {
              "category": "css",
              "name": "css",
              "alias": "css",
              "data": [
                {
                  "color": "#ef4444",
                },
              ],
            },
          ],
          "jsx": [],
          "diagnostics": [],
        }
      `)
    })

    it('extract reports parse-error diagnostics', async () => {
      const { compiler } = await createCompiler(baseConfig)
      const raw = compiler.extract(
        `import { css } from '@panda/css';\ncss({ color: }) // syntax error\n`,
        '/src/code.tsx',
      )
      const result = raw as ExtractResult
      // Just message + severity — exact text comes from oxc and isn't part
      // of our contract, but the shape should be stable.
      expect(result.diagnostics.map((d) => ({ severity: d.severity }))).toMatchInlineSnapshot(`
        [
          {
            "severity": "error",
          },
        ]
      `)
    })

    it('throws on invalid matchers shape', async () => {
      const { WasmFileSystem, WasmExtractor } = await loadWasm()
      const fs = new WasmFileSystem()
      expect(() => new WasmExtractor(fs, 'not-an-object' as unknown)).toThrow()
    })
  })

  describe('WasmCompiler', () => {
    it('extracts atoms from a css() call', async () => {
      const { compiler } = await createCompiler(baseConfig)
      expect(compiler.isEmpty()).toBe(true)
      compiler.parseFile('/Button.tsx', `import { css } from '@panda/css'\ncss({ color: 'red', bg: 'blue' })`)
      expect(compiler.isEmpty()).toBe(false)
      expect(compiler.atoms() as Atom[]).toMatchInlineSnapshot(`
        [
          {
            "prop": "bg",
            "value": "blue",
            "conditions": [],
          },
          {
            "prop": "color",
            "value": "red",
            "conditions": [],
          },
        ]
      `)
    })

    it('constructs from a serialized config snapshot', async () => {
      const { compiler } = await createCompiler({
        cwd: '/virtual',
        outdir: 'styled-system',
        importMap: {
          css: ['@panda/css'],
          recipe: ['@panda/recipes'],
          pattern: ['@panda/patterns'],
          jsx: ['@panda/jsx'],
          tokens: ['@panda/tokens'],
        },
        jsxFactory: 'styled',
      })

      expect(compiler.config()).toMatchObject({
        cwd: '/virtual',
        outdir: 'styled-system',
      })
      compiler.parseFile('/Button.tsx', `import { css } from '@panda/css'\ncss({ color: 'red' })`)
      expect(compiler.atoms() as Atom[]).toMatchInlineSnapshot(`
        [
          {
            "prop": "color",
            "value": "red",
            "conditions": [],
          },
        ]
      `)
    })

    it('derives JSX pattern matchers from config', async () => {
      const { compiler } = await createCompiler({
        cwd: '/virtual',
        outdir: 'styled-system',
        importMap: {
          css: ['@panda/css'],
          recipe: ['@panda/recipes'],
          pattern: ['@panda/patterns'],
          jsx: ['@panda/jsx'],
          tokens: ['@panda/tokens'],
        },
        patterns: {
          stack: {
            properties: {
              gap: {},
            },
          },
        },
      })

      compiler.parseFile('/Stack.tsx', `import { Stack } from '@panda/jsx'\nconst el = <Stack gap="4" />`)
      expect(compiler.atoms() as Atom[]).toMatchInlineSnapshot(`
        [
          {
            "prop": "gap",
            "value": "4",
            "conditions": [],
          },
        ]
      `)
    })

    it('cross-file imports fold via the shared WasmFileSystem', async () => {
      const { fs, compiler } = await createCompiler(baseConfig)
      fs.addFile('/proj/tokens.ts', "export const brand = '#ef4444'\n")
      compiler.parseFile(
        '/proj/main.tsx',
        `import { brand } from './tokens'\nimport { css } from '@panda/css'\ncss({ color: brand })`,
      )
      expect(compiler.atoms() as Atom[]).toMatchInlineSnapshot(`
        [
          {
            "prop": "color",
            "value": "#ef4444",
            "conditions": [],
          },
        ]
      `)
    })

    it('dedups atoms across files', async () => {
      const { compiler } = await createCompiler(baseConfig)
      compiler.parseFile('/a.tsx', `import { css } from '@panda/css'\ncss({ color: 'red' })`)
      compiler.parseFile('/b.tsx', `import { css } from '@panda/css'\ncss({ color: 'red', bg: 'blue' })`)
      compiler.parseFile('/c.tsx', `import { css } from '@panda/css'\ncss({ color: 'red' })`)
      expect((compiler.atoms() as Atom[]).length).toBe(2)
      const summary = compiler.summary()
      expect(summary).toMatchInlineSnapshot(`
        {
          "filesProcessed": 3,
          "atomCount": 2,
          "recipeCount": 0,
          "slotRecipeCount": 0,
        }
      `)
    })

    it('refresh and remove update the atom set', async () => {
      const { compiler } = await createCompiler(baseConfig)
      compiler.parseFile('/a.tsx', `import { css } from '@panda/css'\ncss({ color: 'red' })`)
      expect(compiler.refreshFile('/a.tsx', `import { css } from '@panda/css'\ncss({ color: 'blue' })`)).toBe(true)
      expect(compiler.atoms() as Atom[]).toMatchInlineSnapshot(`
        [
          {
            "prop": "color",
            "value": "blue",
            "conditions": [],
          },
        ]
      `)
      expect(compiler.refreshFile('/unknown.tsx', 'whatever')).toBe(false)
      expect(compiler.removeFile('/a.tsx')).toBe(true)
      expect(compiler.removeFile('/a.tsx')).toBe(false)
      expect(compiler.atoms() as Atom[]).toEqual([])
    })

    it('records cva recipes', async () => {
      const { compiler } = await createCompiler(baseConfig)
      compiler.parseFile(
        '/Button.tsx',
        `import { cva } from '@panda/css'\nexport const btn = cva({ base: { p: '2' } })`,
      )
      const recipes = compiler.recipes()
      expect(recipes).toHaveLength(1)
      expect(recipes[0].file).toBe('/Button.tsx')
      expect(recipes[0].recipe).toMatchInlineSnapshot(`
        {
          "base": {
            "p": "2",
          },
        }
      `)
    })

    it('tracks config recipes and slot recipes', async () => {
      const { compiler } = await createCompiler({
        cwd: '/virtual',
        outdir: 'styled-system',
        importMap: {
          css: ['@panda/css'],
          recipe: ['@panda/recipes'],
          pattern: ['@panda/patterns'],
          jsx: ['@panda/jsx'],
          tokens: ['@panda/tokens'],
        },
        theme: {
          recipes: {
            button: {
              base: { display: 'inline-flex' },
              variants: { size: { sm: { fontSize: '12px' } } },
            },
          },
          slotRecipes: {
            card: {
              slots: ['root', 'label'],
              base: {
                root: { padding: '4px' },
                label: { color: 'red' },
              },
            },
          },
        },
      })

      expect(compiler.summary()).toMatchInlineSnapshot(`
        {
          "filesProcessed": 0,
          "atomCount": 0,
          "recipeCount": 1,
          "slotRecipeCount": 1,
        }
      `)
      expect(compiler.recipes().map(({ file }) => file)).toEqual(['theme.recipes.button'])
      expect(compiler.slotRecipes().map(({ file }) => file)).toEqual(['theme.slotRecipes.card'])

      compiler.parseFile('/Button.tsx', `import { css } from '@panda/css'\ncss({ margin: '8px' })`)
      compiler.clear()
      expect(compiler.summary().recipeCount).toBe(1)
      expect(compiler.summary().slotRecipeCount).toBe(1)
      expect(compiler.atoms() as Atom[]).toEqual([])
      expect(compiler.encodedRecipes()).toMatchInlineSnapshot(`
        {
          "base": [],
          "variants": [],
          "atomic": [],
        }
      `)
    })

    it('splits config recipe component props from style props', async () => {
      const { compiler } = await createCompiler({
        cwd: '/virtual',
        outdir: 'styled-system',
        importMap: {
          css: ['@panda/css'],
          recipe: ['@panda/recipes'],
          pattern: ['@panda/patterns'],
          jsx: ['@panda/jsx'],
          tokens: ['@panda/tokens'],
        },
        theme: {
          recipes: {
            button: {
              jsx: ['Action'],
              base: { display: 'inline-flex' },
              variants: { size: { sm: { fontSize: '12px' } } },
            },
          },
          slotRecipes: {
            tabs: {
              jsx: ['Tabs'],
              slots: ['root'],
              variants: {
                size: {
                  sm: { root: { gap: '4px' } },
                },
              },
            },
          },
        },
      })

      const report = compiler.parseFile(
        '/Button.tsx',
        `import { Action, Tabs, TabsRoot } from './components'
         const el = <>
           <Action size="sm" color="red" />
           <Tabs.Root size="sm" padding="2px" />
           <TabsRoot size="sm" margin="8px" />
         </>`,
      )

      expect(report.jsxUsages).toBe(3)
      expect(compiler.atoms() as Atom[]).toMatchInlineSnapshot(`
        [
          {
            "prop": "color",
            "value": "red",
            "conditions": [],
          },
          {
            "prop": "margin",
            "value": "8px",
            "conditions": [],
          },
          {
            "prop": "padding",
            "value": "2px",
            "conditions": [],
          },
        ]
      `)
      expect(compiler.encodedRecipes()).toMatchInlineSnapshot(`
        {
          "base": [
            {
              "recipe": "button",
              "slot": null,
              "className": "button",
              "entries": [
                {
                  "prop": "display",
                  "value": "inline-flex",
                  "conditions": [],
                },
              ],
            },
          ],
          "variants": [
            {
              "recipe": "button",
              "slot": null,
              "className": "button--size_sm",
              "entries": [
                {
                  "prop": "fontSize",
                  "value": "12px",
                  "conditions": [],
                },
              ],
            },
            {
              "recipe": "tabs",
              "slot": "root",
              "className": "tabs__root--size_sm",
              "entries": [
                {
                  "prop": "gap",
                  "value": "4px",
                  "conditions": [],
                },
              ],
            },
          ],
          "atomic": [],
        }
      `)
    })

    it('tracks config recipe function calls', async () => {
      const { compiler } = await createCompiler({
        cwd: '/virtual',
        outdir: 'styled-system',
        importMap: {
          css: ['@panda/css'],
          recipe: ['@panda/recipes'],
          pattern: ['@panda/patterns'],
          jsx: ['@panda/jsx'],
          tokens: ['@panda/tokens'],
        },
        theme: {
          recipes: {
            button: {
              base: { display: 'inline-flex' },
              variants: { size: { sm: { fontSize: '12px' } } },
            },
          },
          slotRecipes: {
            tabs: {
              slots: ['root'],
              variants: {
                size: {
                  sm: { root: { gap: '4px' } },
                },
              },
            },
          },
        },
      })

      compiler.parseFile(
        '/recipes.ts',
        `import { button } from '@panda/recipes'
         import * as recipes from '@panda/recipes'
         button({ size: 'sm', color: 'red' })
         recipes.tabs({ size: 'sm', margin: '8px' })`,
      )

      expect(compiler.atoms() as Atom[]).toEqual([])
      expect(compiler.encodedRecipes()).toMatchInlineSnapshot(`
        {
          "base": [
            {
              "recipe": "button",
              "slot": null,
              "className": "button",
              "entries": [
                {
                  "prop": "display",
                  "value": "inline-flex",
                  "conditions": [],
                },
              ],
            },
          ],
          "variants": [
            {
              "recipe": "button",
              "slot": null,
              "className": "button--size_sm",
              "entries": [
                {
                  "prop": "fontSize",
                  "value": "12px",
                  "conditions": [],
                },
              ],
            },
            {
              "recipe": "tabs",
              "slot": "root",
              "className": "tabs__root--size_sm",
              "entries": [
                {
                  "prop": "gap",
                  "value": "4px",
                  "conditions": [],
                },
              ],
            },
          ],
          "atomic": [],
        }
      `)
    })

    it('applies utility transform callbacks in the JS host', async () => {
      const { compiler } = await createCompiler({
        config: {
          ...baseConfig,
          utilities: {
            size: {
              transform: {
                kind: 'js-callback',
                id: 'utilities.size.transform',
              },
            },
          },
        },
        callbacks: {
          'utility.transform': {
            'utilities.size.transform': (value: string) => ({
              width: value,
              height: value,
            }),
          },
        },
      })

      compiler.parseFile('/Button.tsx', `import { css } from '@panda/css'\ncss({ size: '4px', color: 'red' })`)

      expect(compiler.atoms() as Atom[]).toMatchInlineSnapshot(`
        [
          {
            "prop": "color",
            "value": "red",
            "conditions": [],
          },
          {
            "prop": "height",
            "value": "4px",
            "conditions": [],
          },
          {
            "prop": "width",
            "value": "4px",
            "conditions": [],
          },
        ]
      `)
    })

    it('passes token helpers to utility transform callbacks', async () => {
      const { compiler } = await createCompiler(
        {
          config: {
            ...baseConfig,
            utilities: {
              tint: {
                transform: {
                  kind: 'js-callback',
                  id: 'utilities.tint.transform',
                },
              },
            },
          },
          callbacks: {
            'utility.transform': {
              'utilities.tint.transform': (value: string, args: any) => {
                const mix = args.utils.colorMix(value)
                return {
                  color: args.token('colors.red.500'),
                  opacity: args.token.raw('opacity.50')?.value,
                  backgroundColor: mix.value,
                  '--raw': args.raw,
                }
              },
            },
          },
        },
        {
          tokenDictionary: {
            values: {
              'colors.red.500': '#f00',
              'opacity.50': '0.5',
            },
            vars: {
              'colors.red.500': 'var(--colors-red-500)',
            },
          },
        },
      )

      compiler.parseFile('/Button.tsx', `import { css } from '@panda/css'\ncss({ tint: 'red.500/50' })`)

      expect(compiler.atoms() as Atom[]).toMatchInlineSnapshot(`
        [
          {
            "prop": "--raw",
            "value": "red.500/50",
            "conditions": [],
          },
          {
            "prop": "backgroundColor",
            "value": "color-mix(in srgb, var(--colors-red-500) 50%, transparent)",
            "conditions": [],
          },
          {
            "prop": "color",
            "value": "var(--colors-red-500)",
            "conditions": [],
          },
          {
            "prop": "opacity",
            "value": "0.5",
            "conditions": [],
          },
        ]
      `)
    })

    it('applies utility transform callbacks to encoded config recipes', async () => {
      const { compiler } = await createCompiler({
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap: {
            css: ['@panda/css'],
            recipe: ['@panda/recipes'],
            pattern: ['@panda/patterns'],
            jsx: ['@panda/jsx'],
            tokens: ['@panda/tokens'],
          },
          utilities: {
            size: {
              transform: {
                kind: 'js-callback',
                id: 'utilities.size.transform',
              },
            },
          },
          theme: {
            recipes: {
              button: {
                base: { size: '4px' },
                variants: {
                  size: {
                    sm: { size: '8px' },
                  },
                },
              },
            },
            slotRecipes: {
              tabs: {
                slots: ['root'],
                variants: {
                  size: {
                    sm: { root: { size: '12px' } },
                  },
                },
              },
            },
          },
        },
        callbacks: {
          'utility.transform': {
            'utilities.size.transform': (value: string) => ({
              width: value,
              height: value,
            }),
          },
        },
      })

      compiler.parseFile(
        '/recipes.ts',
        `import { button } from '@panda/recipes'
         import * as recipes from '@panda/recipes'
         button({ size: 'sm' })
         recipes.tabs({ size: 'sm' })`,
      )

      expect(compiler.atoms() as Atom[]).toEqual([])
      expect(compiler.encodedRecipes()).toMatchInlineSnapshot(`
        {
          "base": [
            {
              "recipe": "button",
              "slot": null,
              "className": "button",
              "entries": [
                {
                  "prop": "height",
                  "value": "4px",
                  "conditions": [],
                },
                {
                  "prop": "width",
                  "value": "4px",
                  "conditions": [],
                },
              ],
            },
          ],
          "variants": [
            {
              "recipe": "button",
              "slot": null,
              "className": "button--size_sm",
              "entries": [
                {
                  "prop": "height",
                  "value": "8px",
                  "conditions": [],
                },
                {
                  "prop": "width",
                  "value": "8px",
                  "conditions": [],
                },
              ],
            },
            {
              "recipe": "tabs",
              "slot": "root",
              "className": "tabs__root--size_sm",
              "entries": [
                {
                  "prop": "height",
                  "value": "12px",
                  "conditions": [],
                },
                {
                  "prop": "width",
                  "value": "12px",
                  "conditions": [],
                },
              ],
            },
          ],
          "atomic": [],
        }
      `)
    })

    it('resolves utility values callbacks in config-derived projects', async () => {
      const { compiler } = await createCompiler(
        {
          config: {
            cwd: '/virtual',
            outdir: 'styled-system',
            importMap: {
              css: ['@panda/css'],
              recipe: ['@panda/recipes'],
              pattern: ['@panda/patterns'],
              jsx: ['@panda/jsx'],
              tokens: ['@panda/tokens'],
            },
            conditions: {
              _hover: '&:hover',
            },
            utilities: {
              space: {
                values: {
                  kind: 'js-callback',
                  id: 'utilities.space.values',
                },
              },
            },
          },
          callbacks: {
            'utility.values': {
              'utilities.space.values': (theme: (category: string) => Record<string, string> | undefined) => ({
                ...(theme('spacing') ?? {}),
                compact: '2px',
              }),
            },
          },
        },
        {
          tokenDictionary: {
            values: {
              'spacing.4': '1rem',
            },
            vars: {},
          },
        },
      )

      compiler.parseFile(
        '/Button.tsx',
        `import { css } from '@panda/css'\ncss({ space: '4', _hover: { space: 'compact' } })`,
      )

      expect(compiler.atoms() as Atom[]).toMatchInlineSnapshot(`
        [
          {
            "prop": "space",
            "value": "1rem",
            "conditions": [],
          },
          {
            "prop": "space",
            "value": "2px",
            "conditions": [
              "_hover",
            ],
          },
        ]
      `)
    })

    it('throws when serialized callback refs are missing callbacks', async () => {
      await expect(
        createCompiler({
          config: {
            cwd: '/virtual',
            outdir: 'styled-system',
            importMap: {
              css: ['@panda/css'],
              recipe: ['@panda/recipes'],
              pattern: ['@panda/patterns'],
              jsx: ['@panda/jsx'],
              tokens: ['@panda/tokens'],
            },
            utilities: {
              size: {
                transform: {
                  kind: 'js-callback',
                  id: 'utilities.size.transform',
                },
              },
            },
          },
          callbacks: {},
        }),
      ).rejects.toThrow('Missing utility.transform callback `utilities.size.transform` for `size`')
    })

    it('applies utility transform callbacks under conditions', async () => {
      const { compiler } = await createCompiler({
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap: {
            css: ['@panda/css'],
            recipe: ['@panda/recipes'],
            pattern: ['@panda/patterns'],
            jsx: ['@panda/jsx'],
            tokens: ['@panda/tokens'],
          },
          conditions: {
            _hover: '&:hover',
          },
          utilities: {
            size: {
              transform: {
                kind: 'js-callback',
                id: 'utilities.size.transform',
              },
            },
          },
        },
        callbacks: {
          'utility.transform': {
            'utilities.size.transform': (value: string) => ({
              width: value,
              height: value,
            }),
          },
        },
      })

      compiler.parseFile('/Button.tsx', `import { css } from '@panda/css'\ncss({ _hover: { size: '4px' } })`)

      expect(compiler.atoms() as Atom[]).toMatchInlineSnapshot(`
        [
          {
            "prop": "height",
            "value": "4px",
            "conditions": [
              "_hover",
            ],
          },
          {
            "prop": "width",
            "value": "4px",
            "conditions": [
              "_hover",
            ],
          },
        ]
      `)
    })

    it('applies utility transform callbacks from JSX props', async () => {
      const { compiler } = await createCompiler({
        config: {
          ...baseConfig,
          utilities: {
            size: {
              transform: {
                kind: 'js-callback',
                id: 'utilities.size.transform',
              },
            },
          },
        },
        callbacks: {
          'utility.transform': {
            'utilities.size.transform': (value: string) => ({
              width: value,
              height: value,
            }),
          },
        },
      })

      compiler.parseFile('/Card.tsx', `import { Box } from '@panda/jsx'\nconst el = <Box size="4px" />`)

      expect(compiler.atoms() as Atom[]).toMatchInlineSnapshot(`
        [
          {
            "prop": "height",
            "value": "4px",
            "conditions": [],
          },
          {
            "prop": "width",
            "value": "4px",
            "conditions": [],
          },
        ]
      `)
    })

    it('caches utility transform callback results', async () => {
      let calls = 0
      const { compiler } = await createCompiler({
        config: {
          ...baseConfig,
          utilities: {
            size: {
              transform: {
                kind: 'js-callback',
                id: 'utilities.size.transform',
              },
            },
          },
        },
        callbacks: {
          'utility.transform': {
            'utilities.size.transform': (value: string) => {
              calls += 1
              return { width: value, height: value }
            },
          },
        },
      })

      compiler.parseFile(
        '/Button.tsx',
        `import { css } from '@panda/css'\ncss({ size: '4px', _hover: { size: '4px' } })`,
      )

      compiler.atoms()
      compiler.atoms()
      expect(calls).toBe(1)
    })

    it('reports utility transform callback failures during parseFile', async () => {
      const { compiler } = await createCompiler({
        config: {
          ...baseConfig,
          utilities: {
            size: {
              transform: {
                kind: 'js-callback',
                id: 'utilities.size.transform',
              },
            },
          },
        },
        callbacks: {
          'utility.transform': {
            'utilities.size.transform': () => {
              throw new Error('boom')
            },
          },
        },
      })

      const report = compiler.parseFile('/Button.tsx', `import { css } from '@panda/css'\ncss({ size: '4px' })`)

      expect(
        report.diagnostics.map((diagnostic: any) => ({
          message: diagnostic.message,
          severity: diagnostic.severity,
        })),
      ).toMatchInlineSnapshot(`
        [
          {
            "message": "Utility transform callback \`utilities.size.transform\` for \`size\` threw: boom",
            "severity": "warning",
          },
        ]
      `)
      expect(compiler.atoms()).toMatchInlineSnapshot(`[]`)
    })

    it('does not cache failed utility transform callbacks', async () => {
      let calls = 0
      const { compiler } = await createCompiler({
        config: {
          ...baseConfig,
          utilities: {
            size: {
              transform: {
                kind: 'js-callback',
                id: 'utilities.size.transform',
              },
            },
          },
        },
        callbacks: {
          'utility.transform': {
            'utilities.size.transform': (value: string) => {
              calls += 1
              if (calls === 1) throw new Error('boom')
              return { width: value, height: value }
            },
          },
        },
      })

      const source = `import { css } from '@panda/css'\ncss({ size: '4px' })`
      const failed = compiler.parseFile('/Button.tsx', source)
      const retried = compiler.parseFile('/Button.tsx', source)

      expect(
        failed.diagnostics.map((diagnostic: any) => ({
          message: diagnostic.message,
          severity: diagnostic.severity,
        })),
      ).toMatchInlineSnapshot(`
        [
          {
            "message": "Utility transform callback \`utilities.size.transform\` for \`size\` threw: boom",
            "severity": "warning",
          },
        ]
      `)
      expect(retried.diagnostics).toMatchInlineSnapshot(`[]`)
      expect(calls).toBe(2)
      expect(compiler.atoms()).toMatchInlineSnapshot(`
        [
          {
            "prop": "height",
            "value": "4px",
            "conditions": [],
          },
          {
            "prop": "width",
            "value": "4px",
            "conditions": [],
          },
        ]
      `)
    })

    it('applies utility transform callbacks during refreshFile', async () => {
      const { compiler } = await createCompiler({
        config: {
          ...baseConfig,
          utilities: {
            size: {
              transform: {
                kind: 'js-callback',
                id: 'utilities.size.transform',
              },
            },
          },
        },
        callbacks: {
          'utility.transform': {
            'utilities.size.transform': (value: string) => ({ width: value, height: value }),
          },
        },
      })

      compiler.parseFile('/Button.tsx', `import { css } from '@panda/css'\ncss({ size: '4px' })`)
      expect(compiler.refreshFile('/Button.tsx', `import { css } from '@panda/css'\ncss({ size: '8px' })`)).toBe(true)

      expect(compiler.atoms()).toMatchInlineSnapshot(`
        [
          {
            "prop": "height",
            "value": "8px",
            "conditions": [],
          },
          {
            "prop": "width",
            "value": "8px",
            "conditions": [],
          },
        ]
      `)
    })

    it('shares utility transform cache between atoms and encoded recipes', async () => {
      let calls = 0
      const { compiler } = await createCompiler(
        {
          config: {
            cwd: '/virtual',
            outdir: 'styled-system',
            importMap: {
              css: ['@panda/css'],
              recipe: ['@panda/recipes'],
              pattern: ['@panda/patterns'],
              jsx: ['@panda/jsx'],
              tokens: ['@panda/tokens'],
            },
            utilities: {
              size: {
                transform: {
                  kind: 'js-callback',
                  id: 'utilities.size.transform',
                },
              },
            },
            theme: {
              recipes: {
                button: {
                  base: { size: '4px' },
                },
              },
            },
          },
          callbacks: {
            'utility.transform': {
              'utilities.size.transform': (value: string) => {
                calls += 1
                return { width: value, height: value }
              },
            },
          },
        },
        {},
      )

      compiler.parseFile(
        '/Button.tsx',
        `import { css } from '@panda/css'
         import { button } from '@panda/recipes'
         css({ size: '4px' })
         button()`,
      )

      compiler.atoms()
      compiler.encodedRecipes()
      expect(calls).toBe(1)
    })

    it('applies pattern transform callbacks with helpers', async () => {
      const { compiler } = await createCompiler({
        config: {
          cwd: '/virtual',
          outdir: 'styled-system',
          importMap: {
            css: ['@panda/css'],
            recipe: ['@panda/recipes'],
            pattern: ['@panda/patterns'],
            jsx: ['@panda/jsx'],
            tokens: ['@panda/tokens'],
          },
          conditions: {
            _hover: '&:hover',
          },
          patterns: {
            stack: {
              properties: {
                gap: {},
              },
              transform: {
                kind: 'js-callback',
                id: 'patterns.stack.transform',
              },
            },
          },
        },
        callbacks: {
          'pattern.transform': {
            'patterns.stack.transform': (props: { gap?: unknown }, helpers: PatternHelpers) => ({
              display: 'flex',
              gap: helpers.map(props.gap, (value) =>
                helpers.isCssUnit(value) || helpers.isCssVar(value) || helpers.isCssFunction(value)
                  ? value
                  : `token(spacing.${value}, ${value})`,
              ),
            }),
          },
        },
      })

      compiler.parseFile(
        '/Stack.tsx',
        `import { stack } from '@panda/patterns'
         import { Stack } from '@panda/jsx'
         stack({ gap: { base: '4', _hover: '8px' } })
         const el = <Stack gap="var(--gap)" />`,
      )

      expect(compiler.atoms() as Atom[]).toMatchInlineSnapshot(`
        [
          {
            "prop": "display",
            "value": "flex",
            "conditions": [],
          },
          {
            "prop": "gap",
            "value": "token(spacing.4, 4)",
            "conditions": [],
          },
          {
            "prop": "gap",
            "value": "var(--gap)",
            "conditions": [],
          },
          {
            "prop": "gap",
            "value": "8px",
            "conditions": [
              "_hover",
            ],
          },
        ]
      `)
    })

    it('wires pattern transform callbacks through an initialized wasm module', async () => {
      const mod = await loadWasm()
      const { compiler } = createCompilerFromWasmModule(mod, {
        config: {
          ...baseConfig,
          patterns: {
            stack: {
              properties: {
                gap: {},
              },
              transform: {
                kind: 'js-callback',
                id: 'patterns.stack.transform',
              },
            },
          },
        },
        callbacks: {
          'pattern.transform': {
            'patterns.stack.transform': (props: { gap?: unknown }) => ({
              display: 'flex',
              gap: props.gap,
            }),
          },
        },
      })

      compiler.parseFile('/Stack.tsx', `import { stack } from '@panda/patterns'\nstack({ gap: '4px' })`)

      expect(compiler.atoms() as Atom[]).toMatchInlineSnapshot(`
        [
          {
            "prop": "display",
            "value": "flex",
            "conditions": [],
          },
          {
            "prop": "gap",
            "value": "4px",
            "conditions": [],
          },
        ]
      `)
    })

    it('applies pattern defaultValues before wasm pattern transform callbacks', async () => {
      const { compiler } = await createCompiler({
        config: {
          ...baseConfig,
          patterns: {
            stack: {
              properties: {
                gap: {},
              },
              defaultValues: {
                kind: 'js-callback',
                id: 'patterns.stack.defaultValues',
              },
              transform: {
                kind: 'js-callback',
                id: 'patterns.stack.transform',
              },
            },
          },
        },
        callbacks: {
          'pattern.defaultValues': {
            'patterns.stack.defaultValues': () => ({
              gap: '2px',
            }),
          },
          'pattern.transform': {
            'patterns.stack.transform': (props: { gap?: unknown }) => ({
              display: 'flex',
              gap: props.gap,
            }),
          },
        },
      })

      compiler.parseFile(
        '/Stack.tsx',
        `import { stack } from '@panda/patterns'
         stack({})
         stack({ gap: '4px' })`,
      )

      expect(compiler.atoms() as Atom[]).toMatchInlineSnapshot(`
        [
          {
            "prop": "display",
            "value": "flex",
            "conditions": [],
          },
          {
            "prop": "gap",
            "value": "2px",
            "conditions": [],
          },
          {
            "prop": "gap",
            "value": "4px",
            "conditions": [],
          },
        ]
      `)
    })

    it('clear drops every file', async () => {
      const { compiler } = await createCompiler(baseConfig)
      compiler.parseFile('/a.tsx', `import { css } from '@panda/css'\ncss({ color: 'red' })`)
      compiler.parseFile('/b.tsx', `import { css } from '@panda/css'\ncss({ bg: 'blue' })`)
      compiler.clear()
      expect(compiler.isEmpty()).toBe(true)
      expect(compiler.summary()).toMatchInlineSnapshot(`
        {
          "filesProcessed": 0,
          "atomCount": 0,
          "recipeCount": 0,
          "slotRecipeCount": 0,
        }
      `)
    })

    it('tracks conditional config recipe variants', async () => {
      const { compiler } = await createCompiler({
        cwd: '/virtual',
        outdir: 'styled-system',
        importMap: {
          css: ['@panda/css'],
          recipe: ['@panda/recipes'],
          pattern: ['@panda/patterns'],
          jsx: ['@panda/jsx'],
          tokens: ['@panda/tokens'],
        },
        theme: {
          breakpoints: {
            md: '768px',
          },
          recipes: {
            button: {
              variants: {
                size: {
                  sm: { fontSize: '12px' },
                  md: { fontSize: '16px' },
                },
              },
            },
          },
        },
      })

      compiler.parseFile(
        '/recipes.ts',
        `import { button } from '@panda/recipes'
         button({ size: { base: 'sm', md: 'md' } })`,
      )

      expect(compiler.encodedRecipes()).toMatchInlineSnapshot(`
        {
          "base": [],
          "variants": [
            {
              "recipe": "button",
              "slot": null,
              "className": "button--size_md",
              "entries": [
                {
                  "prop": "fontSize",
                  "value": "16px",
                  "conditions": [
                    "md",
                  ],
                },
              ],
            },
            {
              "recipe": "button",
              "slot": null,
              "className": "button--size_sm",
              "entries": [
                {
                  "prop": "fontSize",
                  "value": "12px",
                  "conditions": [],
                },
              ],
            },
          ],
          "atomic": [],
        }
      `)
    })
  })
})

if (!wasmAvailable) {
  describe('@pandacss/compiler-wasm', () => {
    it.skip('wasm bundle not built — run `pnpm --filter @pandacss/compiler-wasm build:wasm` first', () => {
      // placeholder body — the test is skipped; this is only here so the
      // skipped name shows up in CI output as a build prerequisite hint.
    })
  })
}
