import { type BuildInfoArtifact, type Compiler, type Diagnostic } from '@pandacss/compiler-shared'
import { readPandaVersion, type LoadConfigResult } from '@pandacss/config'
import { readFileSync } from 'node:fs'
import { dirname } from 'node:path'

type ResolvedDesignSystem = NonNullable<NonNullable<LoadConfigResult['metadata']>['designSystem']>[number]

export function hydrateDesignSystem(
  compiler: Compiler,
  chain: ResolvedDesignSystem[] | undefined,
  consumerTokenPaths: string[] = [],
): Diagnostic[] {
  if (!chain || chain.length === 0) return []
  const pandaVersion = readPandaVersion()
  const diagnostics: Diagnostic[] = []
  for (const ds of chain) diagnostics.push(...hydrateLevel(compiler, ds, pandaVersion, consumerTokenPaths))
  return diagnostics
}

function hydrateLevel(
  compiler: Compiler,
  ds: ResolvedDesignSystem,
  pandaVersion: string | undefined,
  consumerTokenPaths: string[],
): Diagnostic[] {
  const compat = compiler.designSystem.validate(ds.manifest, { pandaVersion })
  if (!compat.ok) throw incompatibleManifestError(compiler, ds, compat.reason, pandaVersion)

  const diagnostics: Diagnostic[] = []

  let buildInfo: BuildInfoArtifact | undefined
  try {
    buildInfo = JSON.parse(readFileSync(ds.buildInfoPath, 'utf8')) as BuildInfoArtifact
  } catch (error) {
    if (!tryStaleFallback(compiler, ds, diagnostics)) throw hydrateReadError(ds, error)
  }

  if (buildInfo) {
    const result = compiler.designSystem.load(ds.manifest, { buildInfo, pandaVersion })
    if (!result.ok && !tryStaleFallback(compiler, ds, diagnostics)) throw hydrateLoadError(ds, result.reason)
  }

  diagnostics.push(...tokenConflictDiagnostics(compiler, ds, consumerTokenPaths))
  return diagnostics
}

function tryStaleFallback(compiler: Compiler, ds: ResolvedDesignSystem, diagnostics: Diagnostic[]): boolean {
  if (ds.files.length === 0) return false
  const sources = compiler.scan({ include: ds.files, cwd: dirname(ds.manifestPath) })
  compiler.parseFiles(sources)
  diagnostics.push({
    code: 'design_system_buildinfo_stale',
    severity: 'warning',
    category: 'designSystem',
    message: `Re-extracting ${JSON.stringify(ds.name)} from source; rebuild it with \`panda lib\` to restore the fast path.`,
  })
  return true
}

function tokenConflictDiagnostics(
  compiler: Compiler,
  ds: ResolvedDesignSystem,
  consumerTokenPaths: string[],
): Diagnostic[] {
  if (consumerTokenPaths.length === 0 || ds.tokenPaths.length === 0) return []
  return compiler.designSystem.tokenConflicts(consumerTokenPaths, ds.tokenPaths).map((path) => ({
    code: 'design_system_token_conflict',
    severity: 'warning',
    category: 'designSystem',
    message: `Token ${JSON.stringify(path)} is defined by both ${JSON.stringify(ds.name)} and this config; the local value wins.`,
  }))
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

function hydrateReadError(ds: ResolvedDesignSystem, error: unknown): Error {
  return new Error(
    `Failed to hydrate designSystem ${JSON.stringify(ds.name)} from ${JSON.stringify(ds.buildInfoPath)}: ${errorMessage(error)}`,
  )
}

function hydrateLoadError(ds: ResolvedDesignSystem, reason: string): Error {
  return new Error(
    `Failed to hydrate designSystem ${JSON.stringify(ds.name)} from ${JSON.stringify(ds.buildInfoPath)}: incompatible buildInfo ${reason}.`,
  )
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
