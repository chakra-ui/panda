import type { DesignSystemManifest, DesignSystemManifestInput } from '@pandacss/compiler-shared'
import { expect, it } from 'vitest'

import { baseConfig, describeIfBuilt, describeMissingWasm } from './helpers'
import { createCompiler } from '../src'

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

describeIfBuilt('@pandacss/compiler-wasm designSystem', () => {
  it('create() stamps the engine schema version and carries input fields', async () => {
    const app = await createCompiler(baseConfig)
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

  // serde_wasm_bindgen serializes maps as objects — importMap must be a plain
  // object across the boundary, not a Map (parity with the native binding).
  it('create() returns importMap as a plain object', async () => {
    const app = await createCompiler(baseConfig)
    const { importMap } = app.designSystem.create(fullInput)

    expect(importMap).not.toBeInstanceOf(Map)
    expect(Object.getPrototypeOf(importMap)).toBe(Object.prototype)
  })

  it('create() omits absent optionals on the wire', async () => {
    const app = await createCompiler(baseConfig)
    const manifest = app.designSystem.create({
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

  it('create() throws when a required field is missing', async () => {
    const app = await createCompiler(baseConfig)
    expect(() =>
      // @ts-expect-error - missing required `panda`
      app.designSystem.create({ name: '@acme/ds', preset: './preset.mjs', buildInfo: './panda.buildinfo.json' }),
    ).toThrow()
  })

  it('validate() accepts a manifest with a matching schemaVersion', async () => {
    const app = await createCompiler(baseConfig)
    expect(app.designSystem.validate(app.designSystem.create(fullInput))).toEqual({ ok: true })
  })

  it('validate() rejects an unsupported schemaVersion', async () => {
    const app = await createCompiler(baseConfig)
    const manifest: DesignSystemManifest = {
      ...app.designSystem.create(fullInput),
      schemaVersion: app.designSystem.schemaVersion + 1,
    }
    expect(app.designSystem.validate(manifest)).toEqual({ ok: false, reason: 'schemaVersion' })
  })

  it('validate() rejects when the running Panda major is outside the manifest range', async () => {
    const app = await createCompiler(baseConfig)
    const manifest = app.designSystem.create(fullInput)
    expect(app.designSystem.validate(manifest, { pandaVersion: '1.9.0' })).toEqual({ ok: false, reason: 'pandaRange' })
  })

  // load(): produce a manifest + build info on a lib, then load into a fresh
  // consumer across the wasm boundary — the full consumer round-trip.
  it('load() validates + tree-shakes the library build info to imported modules', async () => {
    const lib = await createCompiler(baseConfig)
    lib.parseFileSource('button.tsx', "import { css } from '@panda/css'\nexport const Button = css({ color: 'red' })")
    lib.parseFileSource('card.tsx', "import { css } from '@panda/css'\nexport const Card = css({ background: 'blue' })")

    const buildInfo = {
      ...lib.buildInfo.create({ panda: '^2.0.0' }),
      exports: { Button: 'button.tsx', Card: 'card.tsx' },
    }
    const manifest = lib.designSystem.create(fullInput)

    const app = await createCompiler(baseConfig)
    expect(app.designSystem.load(manifest, { buildInfo, imports: ['Button'] })).toEqual({
      ok: true,
      name: '@acme/ds',
      modules: ['button.tsx'],
    })

    // card's `background: blue` should not hydrate.
    expect(app.getLayerCss({ layers: ['utilities'] }).css).toMatchInlineSnapshot(`
      "@layer utilities {
        .color_red {
          color: red;
        }
      }
      "
    `)
  })

  it('load() bails on an incompatible build info', async () => {
    const lib = await createCompiler(baseConfig)
    lib.parseFileSource('button.tsx', "import { css } from '@panda/css'\nexport const Button = css({ color: 'red' })")
    const buildInfo = lib.buildInfo.create({ panda: '^2.0.0' })
    const stale = { ...buildInfo, schemaVersion: buildInfo.schemaVersion + 1 }

    const app = await createCompiler(baseConfig)
    expect(app.designSystem.load(app.designSystem.create(fullInput), { buildInfo: stale })).toEqual({
      ok: false,
      reason: 'schemaVersion',
      modules: [],
    })
  })

  // resolveChain across the boundary: ordered plan and cycle detection.
  it('resolveChain() orders a chain root-first and reports cycles', async () => {
    const app = await createCompiler(baseConfig)
    const node = (name: string, parent?: string) =>
      app.designSystem.create({
        name,
        panda: '^2.0.0',
        preset: './preset.mjs',
        buildInfo: './panda.buildinfo.json',
        designSystem: parent,
      })

    expect(
      app.designSystem.resolveChain([node('@acme/marketing', '@acme/foundations'), node('@acme/foundations')]),
    ).toEqual({ ok: true, order: ['@acme/foundations', '@acme/marketing'] })

    expect(app.designSystem.resolveChain([node('@acme/a', '@acme/b'), node('@acme/b', '@acme/a')])).toEqual({
      ok: false,
      reason: 'cycle',
      cycle: ['@acme/a', '@acme/b', '@acme/a'],
    })
  })
})

describeMissingWasm()
