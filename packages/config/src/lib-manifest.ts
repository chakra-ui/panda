import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { isObject } from '@pandacss/shared'
import type { LibManifest } from '@pandacss/types'

const CURRENT_LIB_MANIFEST_VERSION = 1

export interface ReadLibManifestResult {
  manifest: LibManifest
  manifestPath: string
}

export function readLibManifest(packageName: string, cwd: string): ReadLibManifestResult {
  // `createRequire` anchors resolution on the directory of the given path; the
  // file itself doesn't need to exist. Use `package.json` rather than a
  // fictitious `noop.js` so the anchor is an honest, conventional location.
  const require = createRequire(join(cwd, 'package.json'))

  let manifestPath: string
  try {
    manifestPath = require.resolve(`${packageName}/panda.lib.json`)
  } catch (error) {
    throw new Error(
      `Cannot resolve '${packageName}/panda.lib.json' from '${cwd}'. ` +
        `The package must be installed and its package.json must expose ` +
        `'./panda.lib.json' in its 'exports' map.`,
      { cause: error },
    )
  }

  const raw = readFileSync(manifestPath, 'utf-8')

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    throw new Error(`Invalid JSON in '${manifestPath}'.`, { cause: error })
  }

  const manifest = validate(parsed, manifestPath)
  return { manifest, manifestPath }
}

function validate(value: unknown, path: string): LibManifest {
  if (!isObject(value)) {
    throw new Error(`Manifest at '${path}' must be an object.`)
  }

  const required: Array<keyof LibManifest> = [
    'schemaVersion',
    'name',
    'version',
    'panda',
    'preset',
    'importMap',
    'buildinfo',
  ]
  for (const key of required) {
    if (!(key in value)) {
      throw new Error(`Manifest at '${path}' is missing required field '${key}'.`)
    }
  }

  const v = value as Record<string, unknown>

  if (typeof v.schemaVersion !== 'number' || !Number.isInteger(v.schemaVersion)) {
    throw new Error(`Manifest at '${path}': 'schemaVersion' must be an integer.`)
  }
  if (v.schemaVersion !== CURRENT_LIB_MANIFEST_VERSION) {
    const direction =
      v.schemaVersion > CURRENT_LIB_MANIFEST_VERSION
        ? `was built with a newer Panda (manifest schema v${v.schemaVersion}). Upgrade '@pandacss/dev' in this project, or rebuild the lib with the matching version.`
        : `was built with an older Panda (manifest schema v${v.schemaVersion}). Rebuild the lib with the current '@pandacss/dev' (\`panda lib\`), or downgrade this project to match.`
    throw new Error(
      `Manifest at '${path}': schemaVersion ${v.schemaVersion} is incompatible with this reader (expects v${CURRENT_LIB_MANIFEST_VERSION}). The lib ${direction}`,
    )
  }
  if (typeof v.name !== 'string') {
    throw new Error(`Manifest at '${path}': 'name' must be a string.`)
  }
  if (typeof v.version !== 'string') {
    throw new Error(`Manifest at '${path}': 'version' must be a string.`)
  }
  if (typeof v.panda !== 'string') {
    throw new Error(`Manifest at '${path}': 'panda' must be a string.`)
  }
  if (typeof v.preset !== 'string') {
    throw new Error(`Manifest at '${path}': 'preset' must be a string.`)
  }
  if (v.presetExport !== undefined && typeof v.presetExport !== 'string') {
    throw new Error(`Manifest at '${path}': 'presetExport' must be a string if present.`)
  }
  if (typeof v.buildinfo !== 'string') {
    throw new Error(`Manifest at '${path}': 'buildinfo' must be a string.`)
  }
  if (!isObject(v.importMap)) {
    throw new Error(`Manifest at '${path}': 'importMap' must be an object.`)
  }
  if (v.files !== undefined && !Array.isArray(v.files)) {
    throw new Error(`Manifest at '${path}': 'files' must be an array if present.`)
  }

  return v as unknown as LibManifest
}
