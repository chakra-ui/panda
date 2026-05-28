import { expect, it } from 'vitest'

import { loadWasm } from '../src'
import { describeIfBuilt, describeMissingWasm } from './helpers'

describeIfBuilt('@pandacss/compiler-wasm filesystem', () => {
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

describeMissingWasm()
