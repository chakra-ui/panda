import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { test as base } from 'vitest'

/** Per-test temp cwd with automatic cleanup (Vitest fixture). */
export const test = base.extend<{ cwd: string }>({
  // eslint-disable-next-line no-empty-pattern -- vitest fixture API
  cwd: async ({}, use) => {
    const dir = realpathSync(mkdtempSync(join(tmpdir(), 'panda-ds-')))
    await use(dir)
    rmSync(dir, { recursive: true, force: true })
  },
})

export interface DesignSystemFixture {
  manifest?: Record<string, unknown>
  packageJson?: Record<string, unknown>
  preset?: Record<string, unknown> | string
  /** When false, skip writing an empty buildinfo placeholder. Default true. */
  writeBuildInfo?: boolean
}

export interface DesignSystemPackageFixture extends DesignSystemFixture {
  cwd: string
  name: string
}

export function writeFileTree(root: string, files: Record<string, string>): void {
  for (const [path, content] of Object.entries(files)) {
    const target = join(root, path)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, content)
  }
}

export function moduleDir(root: string, specifier: string): string {
  return join(root, 'node_modules', ...specifier.split('/'))
}

export function json(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

export function toRelativePath(root: string, filePath: string): string {
  const realRoot = realpathSync(root)
  const normalizedPath = filePath.startsWith(root) ? `${realRoot}${filePath.slice(root.length)}` : filePath
  return relative(realRoot, normalizedPath).split('\\').join('/')
}

export function toRelativePaths(root: string, paths: string[]): string[] {
  return paths.map((path) => toRelativePath(root, path)).sort()
}

/** Write a design-system package shaped like `panda lib` (manifest + preset exports). */
export function writeDesignSystemPackage(fixture: DesignSystemPackageFixture): void {
  writeDesignSystemAt(moduleDir(fixture.cwd, fixture.name), fixture.name, fixture)
}

export function writeDesignSystemAt(dir: string, fallbackName: string, fixture: DesignSystemFixture = {}): void {
  const manifest = {
    schemaVersion: 1,
    name: fallbackName,
    panda: '^2.0.0',
    preset: './preset.mjs',
    buildInfo: './buildinfo.json',
    ...fixture.manifest,
  }
  const presetFile = typeof manifest.preset === 'string' ? manifest.preset.replace(/^\.\//, '') : 'preset.mjs'
  const buildInfoFile =
    typeof manifest.buildInfo === 'string' ? manifest.buildInfo.replace(/^\.\//, '') : 'buildinfo.json'
  const packageName = typeof manifest.name === 'string' ? manifest.name : fallbackName
  const { exports: authoredExports, ...packageJsonRest } = fixture.packageJson ?? {}
  const exports =
    authoredExports === undefined
      ? { './panda/*': './panda/*' }
      : (authoredExports as Record<string, unknown> | string | unknown[])

  const files: Record<string, string> = {
    'package.json': json({
      name: packageName,
      version: '1.0.0',
      ...packageJsonRest,
      exports,
    }),
    'panda/lib.json': json(manifest),
    [`panda/${presetFile}`]: presetModule(fixture.preset ?? { name: packageName }),
  }

  if (fixture.writeBuildInfo !== false && typeof manifest.buildInfo === 'string') {
    files[`panda/${buildInfoFile}`] = '{}\n'
  }

  writeFileTree(dir, files)
}

function presetModule(preset: Record<string, unknown> | string): string {
  return typeof preset === 'string' ? preset : `export default ${json(preset)}`
}
