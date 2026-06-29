import type { DesignSystemManifest, DesignSystemManifestInput } from '@pandacss/compiler-shared'
import { describe, expect, it } from 'vitest'
import { createProject } from './test-utils'

const project = () => createProject({})

const fullInput: DesignSystemManifestInput = {
  name: '@acme/ds',
  version: '1.2.3',
  panda: '^2.0.0',
  preset: './preset.mjs',
  buildInfo: './panda.buildinfo.json',
  importMap: { css: '@acme/ds/css', recipes: '@acme/ds/recipes' },
  designSystem: '@acme/foundations',
  files: ['./dist/**/*.mjs'],
}

describe('compiler.designSystem', () => {
  it('create() stamps the engine schema version and carries input fields', () => {
    const app = project()
    const manifest = app.designSystem.create(fullInput)

    expect(manifest.schemaVersion).toBe(app.designSystem.schemaVersion)
    expect(manifest).toMatchObject({
      name: '@acme/ds',
      version: '1.2.3',
      panda: '^2.0.0',
      preset: './preset.mjs',
      buildInfo: './panda.buildinfo.json',
      importMap: { css: '@acme/ds/css', recipes: '@acme/ds/recipes' },
      designSystem: '@acme/foundations',
      files: ['./dist/**/*.mjs'],
    })
  })

  it('create() omits absent optionals on the wire', () => {
    const manifest = project().designSystem.create({
      name: '@acme/ds',
      panda: '^2.0.0',
      preset: './preset.mjs',
      buildInfo: './panda.buildinfo.json',
    })

    expect(manifest.version).toBeUndefined()
    expect(manifest.importMap).toBeUndefined()
    expect(manifest.designSystem).toBeUndefined()
    expect('files' in manifest).toBe(false)
  })

  it('create() throws when a required field is missing', () => {
    const app = project()
    expect(() =>
      // @ts-expect-error - missing required `panda`
      app.designSystem.create({ name: '@acme/ds', preset: './preset.mjs', buildInfo: './panda.buildinfo.json' }),
    ).toThrow()
  })

  it('create() ignores unknown input fields', () => {
    const manifest = project().designSystem.create({
      name: '@acme/ds',
      panda: '^2.0.0',
      preset: './preset.mjs',
      buildInfo: './panda.buildinfo.json',
      // @ts-expect-error - unknown field is dropped, not surfaced
      bogus: 'ignored',
    })
    expect('bogus' in manifest).toBe(false)
  })

  it('create() collapses an empty files array to absent', () => {
    const manifest = project().designSystem.create({
      name: '@acme/ds',
      panda: '^2.0.0',
      preset: './preset.mjs',
      buildInfo: './panda.buildinfo.json',
      files: [],
    })
    expect('files' in manifest).toBe(false)
  })

  it('validate() accepts a manifest with a matching schemaVersion', () => {
    const app = project()
    expect(app.designSystem.validate(app.designSystem.create(fullInput))).toEqual({ ok: true })
  })

  it('validate() rejects an unsupported schemaVersion', () => {
    const app = project()
    const manifest: DesignSystemManifest = {
      ...app.designSystem.create(fullInput),
      schemaVersion: app.designSystem.schemaVersion + 1,
    }
    expect(app.designSystem.validate(manifest)).toEqual({ ok: false, reason: 'schemaVersion' })
  })

  it('validate() accepts when the running Panda major matches the manifest range', () => {
    const app = project()
    const manifest = app.designSystem.create(fullInput)
    expect(app.designSystem.validate(manifest, { pandaVersion: '2.5.1' })).toEqual({ ok: true })
  })

  it('validate() rejects when the running Panda major is outside the manifest range', () => {
    const app = project()
    const manifest = app.designSystem.create(fullInput)
    expect(app.designSystem.validate(manifest, { pandaVersion: '1.9.0' })).toEqual({ ok: false, reason: 'pandaRange' })
  })

  // --- load(): consumer side — validate + hydrate the library's build info ---

  // A library publishing two styled modules, plus the manifest pointing at it.
  const lib = () => {
    const ds = createProject({ utilities: { padding: { className: 'p' }, margin: { className: 'm' } } })
    ds.parseFileSource(
      'button.tsx',
      "import { css } from '@panda/css'\nexport const Button = css({ color: 'red', padding: '4px' })",
    )
    ds.parseFileSource(
      'card.tsx',
      "import { css } from '@panda/css'\nexport const Card = css({ color: 'red', margin: '8px' })",
    )
    const buildInfo = {
      ...ds.buildInfo.create({ panda: '^2.0.0' }),
      exports: { Button: 'button.tsx', Card: 'card.tsx' },
    }
    const manifest = ds.designSystem.create({ ...fullInput, importMap: undefined })
    return { manifest, buildInfo }
  }

  it('load() hydrates every module when imports are omitted', () => {
    const app = project()
    const { manifest, buildInfo } = lib()

    expect(app.designSystem.load(manifest, { buildInfo })).toEqual({
      ok: true,
      name: '@acme/ds',
      modules: ['button.tsx', 'card.tsx'],
    })
  })

  it('load() tree-shakes to the modules the consumer imports', () => {
    const app = project()
    const { manifest, buildInfo } = lib()

    expect(app.designSystem.load(manifest, { buildInfo, imports: ['Button'] })).toEqual({
      ok: true,
      name: '@acme/ds',
      modules: ['button.tsx'],
    })
    expect(app.getLayerCss({ layers: ['utilities'] }).css).toMatchInlineSnapshot(`
      "@layer utilities {
        .padding_4px {
          padding: 4px;
        }
        .color_red {
          color: red;
        }
      }
      "
    `)
  })

  it('load() with empty imports hydrates nothing', () => {
    const app = project()
    const { manifest, buildInfo } = lib()

    expect(app.designSystem.load(manifest, { buildInfo, imports: [] })).toEqual({
      ok: true,
      name: '@acme/ds',
      modules: [],
    })
  })

  it('load() bails on a manifest schemaVersion mismatch — host re-extracts files', () => {
    const app = project()
    const { manifest, buildInfo } = lib()
    const stale: DesignSystemManifest = { ...manifest, schemaVersion: manifest.schemaVersion + 1 }

    expect(app.designSystem.load(stale, { buildInfo })).toEqual({ ok: false, reason: 'schemaVersion', modules: [] })
  })

  it('load() bails when the running Panda major is outside the range — host re-extracts files', () => {
    const app = project()
    const { manifest, buildInfo } = lib()

    expect(app.designSystem.load(manifest, { buildInfo, pandaVersion: '1.0.0' })).toEqual({
      ok: false,
      reason: 'pandaRange',
      modules: [],
    })
  })

  it('load() bails on an incompatible build info', () => {
    const app = project()
    const { manifest, buildInfo } = lib()
    const stale = { ...buildInfo, schemaVersion: buildInfo.schemaVersion + 1 }

    expect(app.designSystem.load(manifest, { buildInfo: stale })).toEqual({
      ok: false,
      reason: 'schemaVersion',
      modules: [],
    })
  })

  // --- resolveChain(): composition — order a chain of parent design systems ---

  // A bare manifest with just identity + parent; resolveChain reads only those.
  const node = (name: string, parent?: string): DesignSystemManifest =>
    project().designSystem.create({
      name,
      panda: '^2.0.0',
      preset: './preset.mjs',
      buildInfo: './panda.buildinfo.json',
      designSystem: parent,
    })

  it('resolveChain() orders a chain root-first', () => {
    const app = project()
    expect(
      app.designSystem.resolveChain([node('@acme/marketing', '@acme/foundations'), node('@acme/foundations')]),
    ).toEqual({ ok: true, order: ['@acme/foundations', '@acme/marketing'] })
  })

  it('resolveChain() dedupes a shared parent', () => {
    const app = project()
    expect(
      app.designSystem.resolveChain([node('@acme/a', '@acme/base'), node('@acme/b', '@acme/base'), node('@acme/base')]),
    ).toEqual({ ok: true, order: ['@acme/base', '@acme/a', '@acme/b'] })
  })

  it('resolveChain() reports a cycle path', () => {
    const app = project()
    expect(app.designSystem.resolveChain([node('@acme/a', '@acme/b'), node('@acme/b', '@acme/a')])).toEqual({
      ok: false,
      reason: 'cycle',
      cycle: ['@acme/a', '@acme/b', '@acme/a'],
    })
  })

  it('tokenConflicts() reports paths defined by both sides, sorted', () => {
    const app = project()
    expect(app.designSystem.tokenConflicts(['colors.fg', 'colors.brand'], ['colors.brand', 'spacing.sm'])).toEqual([
      'colors.brand',
    ])
    expect(app.designSystem.tokenConflicts(['colors.fg'], ['spacing.sm'])).toEqual([])
  })
})
