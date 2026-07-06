import { describe, expect, test, vi } from 'vitest'
import { Inspector, Linter, ProjectCache, RangeIndex, resolvePandaSettings, sourceCacheKey } from '../src/core'
import type { Compiler, FileInspectionResult } from '@pandacss/compiler'

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

describe('resolvePandaSettings', () => {
  test('reads panda settings and migration config path', () => {
    expect(
      resolvePandaSettings({
        cwd: '/repo',
        settings: {
          panda: { strictDiagnostics: true },
          '@pandacss/configPath': 'panda.config.ts',
        },
      }),
    ).toEqual({
      configPath: 'panda.config.ts',
      cwd: '/repo',
      strictDiagnostics: true,
    })
  })
})

describe('Inspector', () => {
  test('caches one inspection result per compiler, path, and source key', () => {
    const inspectFile = vi.fn(({ path }: { path: string }) => emptyInspection(path))
    const compiler = { inspectFile } as unknown as Compiler
    const inspector = new Inspector()

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

describe('RangeIndex', () => {
  test('finds exact and enclosing ranges', () => {
    const index = new RangeIndex([
      { span: { start: 10, end: 20 }, name: 'outer' },
      { span: { start: 12, end: 15 }, name: 'inner' },
    ])

    expect(index.exact({ start: 12, end: 15 })?.name).toBe('inner')
    expect(index.enclosing({ start: 13, end: 14 })?.name).toBe('outer')
    expect(index.at(16)?.name).toBe('outer')
  })
})

describe('ProjectCache', () => {
  test('builds a project once per settings key', async () => {
    const compiler = { inspectFile: ({ path }: { path: string }) => emptyInspection(path) } as unknown as Compiler
    const createProject = vi.fn(async () => ({
      compiler,
      configPath: '/repo/panda.config.ts',
      dependencies: ['/repo/panda.config.ts'],
      outdir: 'styled-system',
      designSystemDiagnostics: [],
    }))
    const cache = new ProjectCache({ createProject })
    const settings = { cwd: '/repo', strictDiagnostics: false }

    await expect(cache.get(settings)).resolves.toMatchObject({
      compiler,
      configPath: '/repo/panda.config.ts',
      dependencies: ['/repo/panda.config.ts'],
    })
    await cache.get(settings)

    expect(createProject).toHaveBeenCalledTimes(1)
  })
})

describe('Linter', () => {
  test('loads a project and inspects the current source text', async () => {
    const inspection = emptyInspection()
    const inspectFile = vi.fn(() => inspection)
    const compiler = { inspectFile } as unknown as Compiler
    const createProject = vi.fn(async () => ({
      compiler,
      configPath: '/repo/panda.config.ts',
      dependencies: ['/repo/panda.config.ts'],
      outdir: 'styled-system',
      designSystemDiagnostics: [],
    }))
    const linter = new Linter({
      projectCache: new ProjectCache({ createProject }),
    })

    await expect(
      linter.inspect({
        cwd: '/repo',
        filename: '/repo/app.tsx',
        sourceCode: { text: 'css({ color: "red.300" })' },
        settings: {},
      }),
    ).resolves.toMatchObject({
      path: '/repo/app.tsx',
      source: 'css({ color: "red.300" })',
      result: inspection,
    })

    expect(inspectFile).toHaveBeenCalledWith({ path: '/repo/app.tsx', source: 'css({ color: "red.300" })' })
  })
})
