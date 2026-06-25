import {
  checkManifestCompatibility,
  DESIGN_SYSTEM_MANIFEST_SCHEMA_VERSION,
  type DesignSystemManifest,
  type ImportMapOption,
} from '@pandacss/compiler-shared'
import type { UserConfig } from '@pandacss/types'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { PandaError } from './error'
import { ensureConfigObject, errorMessage, type ExtendableConfig } from './shared'

export interface ResolvedDesignSystem {
  name: string
  manifestPath: string
  buildInfoPath: string
  files: string[]
  importMap?: DesignSystemManifest['importMap']
}

export async function loadDesignSystemPreset(
  spec: string,
  cwd: string,
  deps: Set<string>,
  options: { pandaVersion?: string },
): Promise<{ preset: ExtendableConfig; info: ResolvedDesignSystem }> {
  const require = createRequire(resolve(cwd, 'noop.js'))

  let manifestPath: string
  try {
    manifestPath = require.resolve(`${spec}/panda.lib.json`, { paths: [cwd] })
  } catch {
    throw new PandaError(
      'CONFIG_ERROR',
      `💥 designSystem ${JSON.stringify(spec)} could not be resolved. Install it, or — if it isn't a Panda design system — build it with \`panda lib\`.`,
    )
  }
  deps.add(manifestPath)

  let manifest: DesignSystemManifest
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as DesignSystemManifest
  } catch (error) {
    throw new PandaError('CONFIG_ERROR', `💥 Failed to read ${JSON.stringify(manifestPath)}: ${errorMessage(error)}`)
  }
  if (typeof manifest.preset !== 'string') {
    throw new PandaError('CONFIG_ERROR', `💥 ${JSON.stringify(spec)} manifest is missing a "preset" entry.`)
  }

  const compat = checkManifestCompatibility(manifest, {
    schemaVersion: DESIGN_SYSTEM_MANIFEST_SCHEMA_VERSION,
    pandaVersion: options.pandaVersion,
  })
  if (!compat.ok) throw incompatibleError(spec, manifest, compat.reason, options.pandaVersion)

  const presetPath = resolve(dirname(manifestPath), manifest.preset)
  deps.add(presetPath)

  let preset: ExtendableConfig
  try {
    const mod = await import(pathToFileURL(presetPath).href)
    preset = ensureConfigObject(mod.default ?? mod, manifest.name ?? spec)
  } catch (error) {
    if (error instanceof PandaError) throw error
    throw new PandaError(
      'CONFIG_ERROR',
      `💥 Failed to load preset for designSystem ${JSON.stringify(spec)}: ${errorMessage(error)}`,
    )
  }

  return {
    preset,
    info: {
      name: manifest.name ?? spec,
      manifestPath,
      buildInfoPath: resolve(dirname(manifestPath), manifest.buildInfo),
      files: manifest.files ?? [],
      ...(manifest.importMap ? { importMap: manifest.importMap } : {}),
    },
  }
}

export function withDesignSystemImportMap(config: UserConfig, spec: string, info: ResolvedDesignSystem): UserConfig {
  const existing: ImportMapOption[] =
    config.importMap === undefined ? [] : Array.isArray(config.importMap) ? config.importMap : [config.importMap]
  const dsRoot: ImportMapOption = info.importMap ?? spec
  return { ...config, importMap: [dsRoot, outdirBasename(config.outdir), ...existing] }
}

function outdirBasename(outdir: string | undefined): string {
  const parts = (outdir ?? 'styled-system').split('/').filter(Boolean)
  return parts.at(-1) ?? 'styled-system'
}

function incompatibleError(
  spec: string,
  manifest: DesignSystemManifest,
  reason: 'schemaVersion' | 'pandaRange',
  pandaVersion?: string,
): PandaError {
  if (reason === 'schemaVersion') {
    return new PandaError(
      'CONFIG_ERROR',
      `💥 designSystem ${JSON.stringify(spec)} was built for a different Panda manifest format (schemaVersion ${manifest.schemaVersion}, this Panda expects ${DESIGN_SYSTEM_MANIFEST_SCHEMA_VERSION}). Upgrade Panda here, or rebuild the library with \`panda lib\`.`,
    )
  }
  const running = pandaVersion ? ` (you are on ${pandaVersion})` : ''
  return new PandaError(
    'CONFIG_ERROR',
    `💥 designSystem ${JSON.stringify(spec)} requires Panda ${manifest.panda}${running}. This project's Panda doesn't satisfy that range.`,
  )
}
