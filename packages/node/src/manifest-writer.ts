import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { logger } from '@pandacss/logger'
import type { LibManifest } from '@pandacss/types'

const CURRENT_LIB_MANIFEST_VERSION = 1

export interface WriteLibManifestOptions {
  cwd: string
  outdir: string
  preset: string
  buildinfo: string
  importMap: LibManifest['importMap']
  files?: string[]
  schemaVersion?: number
  /** Pre-resolved @pandacss/dev version. Skips the node_modules walk. */
  pandaVersion?: string
  /** Pre-parsed package.json. Skips disk read. */
  pkg?: {
    name?: string
    version?: string
    devDependencies?: Record<string, string>
    peerDependencies?: Record<string, string>
  }
  /** Name of the preset's export. Defaults to 'default' downstream when omitted. */
  presetExport?: string
  /** Parent design system this lib was built against. Carried in the manifest so consumers walk the chain transitively. */
  designSystem?: string
}

export interface WriteLibManifestResult {
  manifestPath: string
  manifest: LibManifest
}

const DEFAULT_SCHEMA_VERSION = CURRENT_LIB_MANIFEST_VERSION

export function writeLibManifest(options: WriteLibManifestOptions): WriteLibManifestResult {
  const { cwd, outdir, preset, buildinfo, importMap, files, schemaVersion } = options

  const pkgPath = join(cwd, 'package.json')
  let pkg: any
  if (options.pkg) {
    pkg = options.pkg
  } else {
    try {
      pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    } catch (error) {
      throw new Error(`Cannot read package.json at '${pkgPath}'.`, { cause: error })
    }
  }

  if (typeof pkg.name !== 'string') {
    throw new Error(`package.json at '${pkgPath}' is missing 'name'.`)
  }
  if (typeof pkg.version !== 'string') {
    throw new Error(`package.json at '${pkgPath}' is missing 'version'.`)
  }

  const declaredPandaRange = pkg.devDependencies?.['@pandacss/dev'] ?? pkg.peerDependencies?.['@pandacss/dev'] ?? ''
  const pandaRange = normalizePandaRange(declaredPandaRange, cwd, options.pandaVersion)

  const manifest: LibManifest = {
    schemaVersion: schemaVersion ?? DEFAULT_SCHEMA_VERSION,
    name: pkg.name,
    version: pkg.version,
    panda: pandaRange,
    preset,
    ...(options.presetExport !== undefined ? { presetExport: options.presetExport } : {}),
    importMap,
    buildinfo,
    ...(files && files.length > 0 ? { files } : {}),
    ...(options.designSystem ? { designSystem: options.designSystem } : {}),
  }

  const manifestDir = join(cwd, outdir)
  mkdirSync(manifestDir, { recursive: true })

  const manifestPath = join(manifestDir, 'panda.lib.json')
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')

  return { manifestPath, manifest }
}

function normalizePandaRange(declared: string, cwd: string, providedVersion?: string): string {
  if (!declared || declared.startsWith('workspace:') || declared.includes('catalog:')) {
    const installedVersion = providedVersion ?? lookupInstalledPandaVersion(cwd)
    if (installedVersion) {
      const major = installedVersion.split('.')[0]
      if (major) {
        return `^${major}.0.0`
      }
    }
    // No declared range and no installed copy to infer from. The manifest will
    // claim compatibility with any panda version — surface this so the lib
    // author can pin a real range before publishing.
    logger.warn(
      'lib',
      `Could not determine the @pandacss/dev version to record in the manifest. ` +
        `Writing 'panda: "*"' — consumers on any panda version will be considered compatible. ` +
        `Declare '@pandacss/dev' in devDependencies (or peerDependencies) with a real range to fix.`,
    )
    return '*'
  }
  return declared
}

function lookupInstalledPandaVersion(cwd: string): string | undefined {
  let dir = cwd
  while (true) {
    try {
      const pkg = JSON.parse(readFileSync(join(dir, 'node_modules', '@pandacss', 'dev', 'package.json'), 'utf-8'))
      const ver = pkg.version
      if (typeof ver === 'string' && ver.length > 0) {
        return ver
      }
      return undefined
    } catch {
      const parent = dirname(dir)
      if (parent === dir) return undefined
      dir = parent
    }
  }
}
