import { mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { readLibManifest } from '../src/lib-manifest'

const fixtureDir = join(__dirname, 'fixtures/lib-manifest')
let tmpRoot: string

beforeAll(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'panda-lib-manifest-'))
  const nodeModules = join(tmpRoot, 'node_modules', '@panda-test')
  mkdirSync(nodeModules, { recursive: true })
  const link = (pkg: string, target: string) => {
    const dest = join(nodeModules, pkg)
    try {
      symlinkSync(join(fixtureDir, target), dest)
    } catch (e: any) {
      if (e.code !== 'EEXIST') throw e
    }
  }
  link('valid-lib', 'valid-pkg')
  link('no-manifest', 'no-manifest-pkg')
  link('malformed', 'malformed-pkg')
  link('incomplete', 'incomplete-pkg')
  link('wrong-type', 'wrong-type-pkg')
  link('with-preset-export', 'with-preset-export-pkg')
  link('wrong-preset-export', 'wrong-preset-export-pkg')
  link('forward-compat', 'forward-compat-pkg')
  link('older-version', 'older-version-pkg')
  link('newer-version', 'newer-version-pkg')
})

afterAll(() => {
  rmSync(tmpRoot, { recursive: true, force: true })
})

describe('readLibManifest', () => {
  test('resolves a valid manifest from a package', () => {
    const result = readLibManifest('@panda-test/valid-lib', tmpRoot)
    expect(result.manifest.name).toBe('@panda-test/valid-lib')
    expect(result.manifest.schemaVersion).toBe(1)
    expect(result.manifest.preset).toBe('./preset.js')
    expect(result.manifestPath).toMatch(/valid-pkg\/dist\/panda\.lib\.json$/)
  })

  test('throws when the package cannot be resolved', () => {
    expect(() => readLibManifest('@panda-test/does-not-exist', tmpRoot)).toThrow(
      /Cannot resolve '@panda-test\/does-not-exist\/panda\.lib\.json'/,
    )
  })

  test('throws when the package has no panda.lib.json export', () => {
    expect(() => readLibManifest('@panda-test/no-manifest', tmpRoot)).toThrow(/Cannot resolve/)
  })

  test('throws on malformed json', () => {
    expect(() => readLibManifest('@panda-test/malformed', tmpRoot)).toThrow(/Invalid JSON/)
  })

  test('throws when required fields are missing', () => {
    expect(() => readLibManifest('@panda-test/incomplete', tmpRoot)).toThrow(/missing required field 'version'/)
  })

  test("throws when 'schemaVersion' is not an integer", () => {
    expect(() => readLibManifest('@panda-test/wrong-type', tmpRoot)).toThrow(/'schemaVersion' must be an integer/)
  })

  test('reads optional presetExport field when present', () => {
    const result = readLibManifest('@panda-test/with-preset-export', tmpRoot)
    expect(result.manifest.presetExport).toBe('examplePreset')
  })

  test('presetExport is undefined when omitted', () => {
    const result = readLibManifest('@panda-test/valid-lib', tmpRoot)
    expect(result.manifest.presetExport).toBeUndefined()
  })

  test("throws when 'presetExport' is not a string", () => {
    expect(() => readLibManifest('@panda-test/wrong-preset-export', tmpRoot)).toThrow(/'presetExport' must be a string/)
  })

  test('throws on older schemaVersion with rebuild-the-lib directive', () => {
    expect(() => readLibManifest('@panda-test/older-version', tmpRoot)).toThrow(
      /schemaVersion 0 is incompatible[\s\S]*older Panda[\s\S]*panda lib/,
    )
  })

  test('throws on newer schemaVersion with upgrade-this-project directive', () => {
    expect(() => readLibManifest('@panda-test/newer-version', tmpRoot)).toThrow(
      /schemaVersion 99 is incompatible[\s\S]*newer Panda[\s\S]*Upgrade '@pandacss\/dev'/,
    )
  })

  test('forward compat: ignores unknown manifest fields without throwing', () => {
    // Manifest declares schemaVersion: 1 but also has fields a future panda might add
    // (futureField, anotherUnknown). Today's reader should accept it and just ignore them.
    const result = readLibManifest('@panda-test/forward-compat', tmpRoot)
    expect(result.manifest.name).toBe('@panda-test/forward-compat')
    expect(result.manifest.schemaVersion).toBe(1)
    // Unknown fields are preserved on the parsed object — readers can choose to use them
    // or ignore them. Older panda just doesn't look at them.
    expect((result.manifest as any).futureField).toBe('v2-only-field')
  })
})
