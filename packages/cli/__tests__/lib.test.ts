import type { DesignSystemManifest } from '@pandacss/compiler-shared'
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
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
    expect(manifest.schemaVersion).toBe(1)
    expect(manifest.name).toBe('@acme/ds')
    expect(manifest.version).toBe('1.2.3')
    expect(manifest.panda).toBe('^2.0.0')
    expect(manifest.preset).toBe('./preset.mjs')
    expect(manifest.buildInfo).toBe('./panda.buildinfo.json')
    expect(manifest.importMap?.css).toBe('@acme/ds/css')

    const buildInfo = JSON.parse(readFileSync(join(dir, 'dist', 'panda.buildinfo.json'), 'utf8'))
    expect(Object.keys(buildInfo.modules).length).toBeGreaterThan(0)
    expect(readFileSync(join(dir, 'dist', 'preset.mjs'), 'utf8')).toMatch(/as default|export default/)

    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
    expect(pkg.exports['./panda.lib.json']).toBe('./dist/panda.lib.json')
    expect(pkg.exports['./preset']).toBe('./dist/preset.mjs')
    expect(result.exportsChanged).toBe(true)
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
})
