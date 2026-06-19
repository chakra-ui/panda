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
})

describeMissingWasm()
