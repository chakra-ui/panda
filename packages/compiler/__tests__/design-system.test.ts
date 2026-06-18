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
})
