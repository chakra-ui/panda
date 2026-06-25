import { type BuildInfoArtifact, type Compiler } from '@pandacss/compiler-shared'
import { readPandaVersion, type LoadConfigResult } from '@pandacss/config'
import { readFileSync } from 'node:fs'

type ResolvedDesignSystem = NonNullable<NonNullable<LoadConfigResult['metadata']>['designSystem']>

export function hydrateDesignSystem(compiler: Compiler, ds: ResolvedDesignSystem | undefined): void {
  if (!ds) return

  const pandaVersion = readPandaVersion()
  const compat = compiler.designSystem.validate(ds.manifest, { pandaVersion })
  if (!compat.ok) {
    throw incompatibleManifestError(compiler, ds, compat.reason, pandaVersion)
  }

  let buildInfo: BuildInfoArtifact
  try {
    buildInfo = JSON.parse(readFileSync(ds.buildInfoPath, 'utf8')) as BuildInfoArtifact
  } catch (error) {
    throw new Error(
      `Failed to hydrate designSystem ${JSON.stringify(ds.name)} from ${JSON.stringify(ds.buildInfoPath)}: ${errorMessage(error)}`,
    )
  }

  const result = compiler.designSystem.load(ds.manifest, { buildInfo, pandaVersion })
  if (!result.ok) {
    throw new Error(
      `Failed to hydrate designSystem ${JSON.stringify(ds.name)} from ${JSON.stringify(ds.buildInfoPath)}: incompatible buildInfo ${result.reason}.`,
    )
  }
}

function incompatibleManifestError(
  compiler: Compiler,
  ds: ResolvedDesignSystem,
  reason: 'schemaVersion' | 'pandaRange',
  pandaVersion?: string,
): Error {
  if (reason === 'schemaVersion') {
    return new Error(
      `Failed to hydrate designSystem ${JSON.stringify(ds.name)} from ${JSON.stringify(ds.manifestPath)}: manifest schemaVersion ${ds.manifest.schemaVersion} is incompatible with this compiler (expected ${compiler.designSystem.schemaVersion}).`,
    )
  }

  const running = pandaVersion ? ` (you are on ${pandaVersion})` : ''
  return new Error(
    `Failed to hydrate designSystem ${JSON.stringify(ds.name)}: manifest requires Panda ${ds.manifest.panda}${running}.`,
  )
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
