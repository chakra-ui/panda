import { describe, expect, test, vi } from 'vitest'
import type { Compiler, FileInspectionResult } from '../../src'
import { FileInspector, sourceCacheKey } from '../../src/tooling'

const emptyInspection = (path = 'app.tsx'): FileInspectionResult => ({
  path,
  usages: [],
  diagnostics: [],
  calls: [],
  jsx: [],
  tokenRefs: [],
  componentEntries: [],
  styleEntries: [],
})

describe('FileInspector', () => {
  test('caches one inspection result per compiler, path, and source key', () => {
    const inspectFile = vi.fn(({ path }: { path: string }) => emptyInspection(path))
    const compiler = { inspectFile } as unknown as Compiler
    const inspector = new FileInspector()

    const first = inspector.inspect(compiler, 'app.tsx', 'css({ color: "red.300" })')
    const second = inspector.inspect(compiler, 'app.tsx', 'css({ color: "red.300" })')
    const third = inspector.inspect(compiler, 'app.tsx', 'css({ color: "blue.300" })')

    expect(first).toBe(second)
    expect(third).not.toBe(first)
    expect(inspectFile).toHaveBeenCalledTimes(2)
  })

  test('source cache key includes source length', () => {
    expect(sourceCacheKey('ab')).not.toBe(sourceCacheKey('aba'))
  })
})
