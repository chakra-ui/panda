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
})

describeMissingWasm()
