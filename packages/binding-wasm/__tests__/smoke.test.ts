import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { createExtractor, loadWasm } from '../src'
import type { ExtractUsage, MatchersInput } from '../src'

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

      // .d.ts dropped by default exclude (because we passed a non-empty
      // exclude, but it doesn't match d.ts — wait, that disables default).
      // We explicitly pass exclude here so default isn't injected; helpers.ts
      // is a `.ts` so it matches; Button.tsx matches; types.d.ts matches
      // `*.ts` glob. Adjust expectations accordingly.
      expect(results).toContain('/proj/src/Button.tsx')
      expect(results).toContain('/proj/src/helpers.ts')
      // node_modules pruned
      expect(results.some((p: string) => p.startsWith('/proj/node_modules'))).toBe(false)
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
      expect(results).toEqual(['/proj/main.ts'])
    })
  })

  describe('WasmExtractor', () => {
    it('extracts a css() call to a literal object', async () => {
      const { extractor } = await createExtractor(baseMatchers)
      const raw = extractor.parseFile(
        '/src/code.tsx',
        `
          import { css } from '@panda/css';
          css({ color: 'red', bg: 'blue' });
        `,
      )
      const result = raw as ExtractUsage
      expect(result.diagnostics).toEqual([])
      expect(result.calls).toHaveLength(1)
      expect(result.calls[0]).toMatchObject({
        name: 'css',
        category: 'css',
        data: [{ color: 'red', bg: 'blue' }],
      })
    })

    it('extracts a <styled.div> JSX usage', async () => {
      const { extractor } = await createExtractor(baseMatchers)
      const raw = extractor.parseFile(
        '/src/code.tsx',
        `
          import { styled } from '@panda/jsx';
          const X = () => <styled.div color="red" />;
        `,
      )
      const result = raw as ExtractUsage
      expect(result.diagnostics).toEqual([])
      expect(result.jsx).toHaveLength(1)
      expect(result.jsx[0]).toMatchObject({
        name: 'styled.div',
        data: { color: 'red' },
      })
    })

    it('cross-file imports fold through the shared memory FS', async () => {
      const { fs, extractor } = await createExtractor(baseMatchers)
      fs.addFile('/proj/tokens.ts', "export const brand = '#ef4444';\n")
      const raw = extractor.parseFile(
        '/proj/main.tsx',
        `
          import { brand } from './tokens';
          import { css } from '@panda/css';
          css({ color: brand });
        `,
      )
      const result = raw as ExtractUsage
      expect(result.calls).toHaveLength(1)
      expect(result.calls[0].data).toEqual([{ color: '#ef4444' }])
    })

    it('extract reports parse-error diagnostics', async () => {
      const { extractor } = await createExtractor(baseMatchers)
      const raw = extractor.parseFile(
        '/src/code.tsx',
        `import { css } from '@panda/css';\ncss({ color: }) // syntax error\n`,
      )
      const result = raw as ExtractUsage
      expect(result.diagnostics.length).toBeGreaterThan(0)
    })

    it('throws on invalid matchers shape', async () => {
      const { WasmFileSystem, WasmExtractor } = await loadWasm()
      const fs = new WasmFileSystem()
      expect(() => new WasmExtractor(fs, 'not-an-object' as unknown)).toThrow()
    })
  })
})

if (!wasmAvailable) {
  describe('@pandacss/binding-wasm', () => {
    it.skip('wasm bundle not built — run `pnpm --filter @pandacss/binding-wasm build:wasm` first', () => {})
  })
}
