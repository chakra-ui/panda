import type { DesignSystemManifest } from '@pandacss/compiler-shared'
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runLib } from '../src'
import { CONFIG } from './helpers'

function createLibFixture(extraConfig = ''): string {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'panda-cli-lib-')))
  const config = extraConfig ? CONFIG.replace('export default {', `export default {\n${extraConfig}`) : CONFIG
  writeFileSync(join(dir, 'panda.config.ts'), config)
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({ name: '@acme/ds', version: '1.2.3', peerDependencies: { '@pandacss/dev': '^2.0.0' } }, null, 2),
  )
  writeFileSync(join(dir, 'button.tsx'), "import { css } from '@panda/css'; css({ color: 'red' })")
  return dir
}

function readManifest(dir: string): DesignSystemManifest {
  return JSON.parse(readFileSync(join(dir, 'dist', 'panda.lib.json'), 'utf8'))
}

describe('lib command', () => {
  let dir: string | undefined

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true })
    dir = undefined
  })

  it('writes manifest, build info, and compiled preset; syncs exports', async () => {
    dir = createLibFixture()

    const result = await runLib({ cwd: dir, logLevel: 'silent' })
    expect(result.ok).toBe(true)

    const manifest = readManifest(dir)
    expect(manifest).toMatchInlineSnapshot(`
      {
        "buildInfo": "./panda.buildinfo.json",
        "files": [
          "../button.tsx",
        ],
        "importMap": {
          "css": "@acme/ds/css",
          "jsx": "@acme/ds/jsx",
          "patterns": "@acme/ds/patterns",
          "recipes": "@acme/ds/recipes",
          "tokens": "@acme/ds/tokens",
        },
        "name": "@acme/ds",
        "panda": "^2.0.0",
        "preset": "./panda.preset.mjs",
        "schemaVersion": 1,
        "version": "1.2.3",
      }
    `)

    const buildInfo = JSON.parse(readFileSync(join(dir, 'dist', 'panda.buildinfo.json'), 'utf8'))
    expect(Object.keys(buildInfo.modules).length).toBeGreaterThan(0)
    expect(readFileSync(join(dir, 'dist', 'panda.preset.mjs'), 'utf8')).toMatch(/as default|export default/)

    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
    expect(pkg.exports).toMatchInlineSnapshot(`
      {
        "./panda.lib.json": "./dist/panda.lib.json",
        "./preset": "./dist/panda.preset.mjs",
      }
    `)
    expect(result.exportsChanged).toBe(true)
  })

  it('preserves an existing string root export when syncing package exports', async () => {
    dir = createLibFixture()
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({ name: '@acme/ds', version: '1.2.3', exports: './dist/index.js' }, null, 2),
    )

    const result = await runLib({ cwd: dir, logLevel: 'silent' })
    expect(result.ok).toBe(true)

    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
    expect(pkg.exports).toMatchInlineSnapshot(`
      {
        ".": "./dist/index.js",
        "./panda.lib.json": "./dist/panda.lib.json",
        "./preset": "./dist/panda.preset.mjs",
      }
    `)
  })

  it('does not write artifacts or sync exports when diagnostics fail the warning budget', async () => {
    dir = createLibFixture()
    writeFileSync(join(dir, 'button.tsx'), "import { css } from '@panda/css'; css({ color: })")

    const result = await runLib({ cwd: dir, logLevel: 'silent', maxWarnings: 0 })
    expect(result.ok).toBe(false)
    expect(existsSync(join(dir, 'dist', 'panda.lib.json'))).toBe(false)
    expect(existsSync(join(dir, 'dist', 'panda.buildinfo.json'))).toBe(false)
    expect(existsSync(join(dir, 'dist', 'panda.preset.mjs'))).toBe(false)

    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
    expect(pkg.exports).toBeUndefined()
  })

  it('is idempotent: a second run leaves the manifest byte-identical and exports unchanged', async () => {
    dir = createLibFixture()

    await runLib({ cwd: dir, logLevel: 'silent' })
    const first = readFileSync(join(dir, 'dist', 'panda.lib.json'), 'utf8')

    const second = await runLib({ cwd: dir, logLevel: 'silent' })
    expect(readFileSync(join(dir, 'dist', 'panda.lib.json'), 'utf8')).toBe(first)
    expect(second.exportsChanged).toBe(false)
  })

  it('reads the declared parent designSystem during config load', async () => {
    dir = createLibFixture("  designSystem: '@acme/foundations',")
    const result = await runLib({ cwd: dir, logLevel: 'silent' })
    expect(result.ok).toBe(false)
    expect(result.diagnostics.some((d) => d.message?.includes('foundations'))).toBe(true)
  })

  it('watch mode generates once and exposes a stop handle', async () => {
    dir = createLibFixture()
    const result = await runLib({ cwd: dir, watch: true, logLevel: 'silent' })
    expect(result.ok).toBe(true)
    expect(typeof result.stop).toBe('function')
    expect(existsSync(join(dir, 'dist', 'panda.lib.json'))).toBe(true)
    await result.stop!()
  })
})
