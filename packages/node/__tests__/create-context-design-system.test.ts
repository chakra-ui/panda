import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'
import { logger } from '@pandacss/logger'
import { PandaContext } from '../src/create-context'

// Cross-package fixture path: lib-manifest fixtures live in @pandacss/config.
// If those fixtures relocate, this path needs to follow.
const fixturesRoot = join(__dirname, '../../config/__tests__/fixtures/lib-manifest')

let tmpRoot: string

beforeAll(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'panda-create-context-ds-'))
  const nm = join(tmpRoot, 'node_modules', '@panda-test')
  mkdirSync(nm, { recursive: true })

  for (const [name, dir] of [
    ['valid-lib', 'valid-pkg'],
    ['broken-buildinfo', 'broken-buildinfo-pkg'],
  ] as const) {
    try {
      symlinkSync(join(fixturesRoot, dir), join(nm, name), 'dir')
    } catch (e: any) {
      if (e.code !== 'EEXIST') throw e
    }
  }
})

afterAll(() => {
  rmSync(tmpRoot, { recursive: true, force: true })
})

const makeConf = (designSystem: string): any => ({
  config: {
    cwd: tmpRoot,
    designSystem,
    include: [],
    outdir: 'styled-system',
  },
  tsconfig: {},
  hooks: {},
  dependencies: [],
  path: '',
  serialized: '',
  deserialize: () => ({}),
})

describe('createContext with designSystem', () => {
  test('hydrates encoder from manifest buildinfo', () => {
    const ctx = new PandaContext(makeConf('@panda-test/valid-lib'))

    const json = ctx.parserOptions.encoder.toJSON()
    expect(json.styles.atomic).toContain('color]___[value:libBrand')
  })

  test('warns gracefully when buildinfo is missing', () => {
    expect(() => new PandaContext(makeConf('@panda-test/broken-buildinfo'))).not.toThrow()
  })

  test('registers manifest + buildinfo paths so a watcher rebuilds when the lib changes', () => {
    const ctx = new PandaContext(makeConf('@panda-test/valid-lib'))

    expect(ctx.designSystemDepFiles).toHaveLength(2)
    expect(ctx.designSystemDepFiles[0]).toMatch(/valid-pkg\/dist\/panda\.lib\.json$/)
    expect(ctx.designSystemDepFiles[1]).toMatch(/valid-pkg\/dist\/panda\.buildinfo\.json$/)
    // Same paths surface through the public explicitDeps that watchConfig consumes.
    expect(ctx.explicitDeps).toEqual(expect.arrayContaining(ctx.designSystemDepFiles))
  })

  test('writes a designsystem-state file on first hydrate and does not log drift', () => {
    const info = vi.spyOn(logger, 'info')
    const isolatedRoot = mkdtempSync(join(tmpdir(), 'panda-drift-first-'))
    mkdirSync(join(isolatedRoot, 'node_modules', '@panda-test'), { recursive: true })
    symlinkSync(join(fixturesRoot, 'valid-pkg'), join(isolatedRoot, 'node_modules', '@panda-test/valid-lib'), 'dir')

    const conf: any = {
      config: {
        cwd: isolatedRoot,
        designSystem: '@panda-test/valid-lib',
        include: [],
        outdir: 'styled-system',
      },
      tsconfig: {},
      hooks: {},
      dependencies: [],
      path: '',
      serialized: '',
      deserialize: () => ({}),
    }
    new PandaContext(conf)

    const stateFile = join(isolatedRoot, 'styled-system', 'panda.designsystem-state.json')
    expect(existsSync(stateFile)).toBe(true)
    expect(JSON.parse(readFileSync(stateFile, 'utf-8'))).toEqual({
      versions: { '@panda-test/valid-lib': '1.0.0' },
    })
    // No prior record means no drift to announce.
    const driftCalls = info.mock.calls.filter(([cat]) => cat === 'designSystem')
    expect(driftCalls).toHaveLength(0)

    rmSync(isolatedRoot, { recursive: true, force: true })
    info.mockRestore()
  })

  test('logs a one-line receipt when lib version changes between codegen runs', () => {
    const info = vi.spyOn(logger, 'info')
    const isolatedRoot = mkdtempSync(join(tmpdir(), 'panda-drift-bump-'))
    mkdirSync(join(isolatedRoot, 'node_modules', '@panda-test'), { recursive: true })
    symlinkSync(join(fixturesRoot, 'valid-pkg'), join(isolatedRoot, 'node_modules', '@panda-test/valid-lib'), 'dir')

    // Seed prior-codegen state at an older version.
    const stateDir = join(isolatedRoot, 'styled-system')
    mkdirSync(stateDir, { recursive: true })
    writeFileSync(
      join(stateDir, 'panda.designsystem-state.json'),
      JSON.stringify({ versions: { '@panda-test/valid-lib': '0.9.0' } }),
    )

    const conf: any = {
      config: {
        cwd: isolatedRoot,
        designSystem: '@panda-test/valid-lib',
        include: [],
        outdir: 'styled-system',
      },
      tsconfig: {},
      hooks: {},
      dependencies: [],
      path: '',
      serialized: '',
      deserialize: () => ({}),
    }
    new PandaContext(conf)

    const driftLog = info.mock.calls.find(
      ([cat, msg]) => cat === 'designSystem' && typeof msg === 'string' && msg.includes('0.9.0 → 1.0.0'),
    )
    expect(driftLog).toBeTruthy()

    rmSync(isolatedRoot, { recursive: true, force: true })
    info.mockRestore()
  })

  test('warns gracefully when designSystem package cannot be resolved', () => {
    const conf: any = {
      config: {
        cwd: tmpRoot,
        designSystem: '@panda-test/does-not-exist',
        include: [],
        outdir: 'styled-system',
      },
      tsconfig: {},
      hooks: {},
      dependencies: [],
      path: '',
      serialized: '',
      deserialize: () => ({}),
    }

    expect(() => new PandaContext(conf)).not.toThrow()
  })
})
