import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { createExtractor, createProject, loadWasm } from '../src'
import type { Atom, ExtractUsage, MatchersInput } from '../src'

const PKG_NODE = resolve(__dirname, '..', 'pkg-node', 'binding_wasm.js')
const wasmAvailable = existsSync(PKG_NODE)

// Skip the suite if the wasm bundle hasn't been built. The CI / dev
// workflow is: `pnpm --filter @pandacss/binding-wasm build:wasm` first,
// then run tests.
const describeIfBuilt = wasmAvailable ? describe : describe.skip

const baseMatchers: MatchersInput = {
  css: { modules: ['@panda/css'], names: ['css', 'cva', 'sva'] },
  recipe: { modules: ['@panda/css'], names: null },
  pattern: { modules: ['@panda/css'], names: null },
  jsx: { modules: ['@panda/jsx'], names: ['styled', 'Box'] },
  tokens: { modules: ['@panda/css'], names: ['token'] },
}

/// Strip span offsets from a result so snapshots don't churn when the
/// source string changes whitespace. Use when the test is about extraction
/// shape (calls/jsx/data) rather than precise byte locations.
function withoutSpans(result: ExtractUsage): unknown {
  return {
    calls: result.calls.map(({ span: _span, ...rest }) => rest),
    jsx: result.jsx.map(({ span: _span, ...rest }) => rest),
    diagnostics: result.diagnostics.map((d) => ({
      message: d.message,
      severity: d.severity,
    })),
  }
}

describeIfBuilt('@pandacss/binding-wasm', () => {
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

  describe('WasmExtractor', () => {
    it('extracts a css() call to a literal object', async () => {
      const { extractor } = await createExtractor(baseMatchers)
      const raw = extractor.parseFile(
        '/src/code.tsx',
        `import { css } from '@panda/css';\ncss({ color: 'red', bg: 'blue' });\n`,
      )
      expect(withoutSpans(raw as ExtractUsage)).toMatchInlineSnapshot(`
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
      const { extractor } = await createExtractor(baseMatchers)
      const raw = extractor.parseFile(
        '/src/code.tsx',
        `import { styled } from '@panda/jsx';\nconst X = () => <styled.div color="red" />;\n`,
      )
      expect(withoutSpans(raw as ExtractUsage)).toMatchInlineSnapshot(`
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
      const { fs, extractor } = await createExtractor(baseMatchers)
      fs.addFile('/proj/tokens.ts', "export const brand = '#ef4444';\n")
      const raw = extractor.parseFile(
        '/proj/main.tsx',
        `import { brand } from './tokens';\nimport { css } from '@panda/css';\ncss({ color: brand });\n`,
      )
      expect(withoutSpans(raw as ExtractUsage)).toMatchInlineSnapshot(`
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
      const { extractor } = await createExtractor(baseMatchers)
      const raw = extractor.parseFile(
        '/src/code.tsx',
        `import { css } from '@panda/css';\ncss({ color: }) // syntax error\n`,
      )
      const result = raw as ExtractUsage
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

  describe('WasmProject', () => {
    it('extracts atoms from a css() call', async () => {
      const { project } = await createProject(baseMatchers)
      project.parseFile('/Button.tsx', `import { css } from '@panda/css'\ncss({ color: 'red', bg: 'blue' })`)
      expect(project.atoms() as Atom[]).toMatchInlineSnapshot(`
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

    it('cross-file imports fold via the shared WasmFileSystem', async () => {
      const { fs, project } = await createProject(baseMatchers)
      fs.addFile('/proj/tokens.ts', "export const brand = '#ef4444'\n")
      project.parseFile(
        '/proj/main.tsx',
        `import { brand } from './tokens'\nimport { css } from '@panda/css'\ncss({ color: brand })`,
      )
      expect(project.atoms() as Atom[]).toMatchInlineSnapshot(`
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
      const { project } = await createProject(baseMatchers)
      project.parseFile('/a.tsx', `import { css } from '@panda/css'\ncss({ color: 'red' })`)
      project.parseFile('/b.tsx', `import { css } from '@panda/css'\ncss({ color: 'red', bg: 'blue' })`)
      project.parseFile('/c.tsx', `import { css } from '@panda/css'\ncss({ color: 'red' })`)
      expect((project.atoms() as Atom[]).length).toBe(2)
      const summary = project.summary()
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
      const { project } = await createProject(baseMatchers)
      project.parseFile('/a.tsx', `import { css } from '@panda/css'\ncss({ color: 'red' })`)
      expect(project.refreshFile('/a.tsx', `import { css } from '@panda/css'\ncss({ color: 'blue' })`)).toBe(true)
      expect(project.atoms() as Atom[]).toMatchInlineSnapshot(`
        [
          {
            "prop": "color",
            "value": "blue",
            "conditions": [],
          },
        ]
      `)
      expect(project.refreshFile('/unknown.tsx', 'whatever')).toBe(false)
      expect(project.removeFile('/a.tsx')).toBe(true)
      expect(project.removeFile('/a.tsx')).toBe(false)
      expect(project.atoms() as Atom[]).toEqual([])
    })

    it('records cva recipes', async () => {
      const { project } = await createProject(baseMatchers)
      project.parseFile('/Button.tsx', `import { cva } from '@panda/css'\nexport const btn = cva({ base: { p: '2' } })`)
      const recipes = project.recipes()
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

    it('clear drops every file', async () => {
      const { project } = await createProject(baseMatchers)
      project.parseFile('/a.tsx', `import { css } from '@panda/css'\ncss({ color: 'red' })`)
      project.parseFile('/b.tsx', `import { css } from '@panda/css'\ncss({ bg: 'blue' })`)
      project.clear()
      expect(project.summary()).toMatchInlineSnapshot(`
        {
          "filesProcessed": 0,
          "atomCount": 0,
          "recipeCount": 0,
          "slotRecipeCount": 0,
        }
      `)
    })
  })
})

if (!wasmAvailable) {
  describe('@pandacss/binding-wasm', () => {
    it.skip('wasm bundle not built — run `pnpm --filter @pandacss/binding-wasm build:wasm` first', () => {
      // placeholder body — the test is skipped; this is only here so the
      // skipped name shows up in CI output as a build prerequisite hint.
    })
  })
}
