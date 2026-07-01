import { type BuildInfoArtifact, type Compiler, type Diagnostic } from '@pandacss/compiler-shared'
import { collectArtifactConflicts, readPandaVersion, type LoadConfigResult } from '@pandacss/config'

type ResolvedDesignSystem = NonNullable<NonNullable<LoadConfigResult['metadata']>['designSystem']>[number]

export function artifactConflictDiagnostics(metadata: LoadConfigResult['metadata']): Diagnostic[] {
  return collectArtifactConflicts(metadata).flatMap((conflict) => [
    ...conflict.recipes.map((name) => artifactConflict('Recipe', name, conflict.name)),
    ...conflict.patterns.map((name) => artifactConflict('Pattern', name, conflict.name)),
  ])
}

function artifactConflict(kind: 'Recipe' | 'Pattern', name: string, designSystem: string): Diagnostic {
  return {
    code: 'design_system_artifact_conflict',
    severity: 'warning',
    category: 'designSystem',
    message: `${kind} ${JSON.stringify(name)} is defined by both ${JSON.stringify(designSystem)} and this config; your definition is merged over the design system's.`,
  }
}

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
    const content = compiler.fs.readFile(ds.buildInfoPath)
    if (content == null) throw new Error(`file not found`)
    buildInfo = JSON.parse(content) as BuildInfoArtifact
  } catch (error) {
    if (!tryStaleFallback(compiler, ds, diagnostics)) throw hydrateReadError(ds, error)
  }

  if (buildInfo) {
    const result = compiler.designSystem.load(ds.manifest, { buildInfo, pandaVersion })
    if (!result.ok && !tryStaleFallback(compiler, ds, diagnostics)) throw hydrateLoadError(ds, result.reason)
  }

  diagnostics.push(...tokenConflictDiagnostics(ds, consumerTokenPaths))
  return diagnostics
}

function tryStaleFallback(compiler: Compiler, ds: ResolvedDesignSystem, diagnostics: Diagnostic[]): boolean {
  if (ds.files.length === 0) return false
  const sources = compiler.scan({ include: ds.files, cwd: compiler.path.dirname(ds.manifestPath) })
  if (sources.length === 0) return false

  compiler.parseFiles(sources)
  diagnostics.push({
    code: 'design_system_buildinfo_stale',
    severity: 'warning',
    category: 'designSystem',
    message: `Re-extracting ${JSON.stringify(ds.name)} from source; rebuild it with \`panda lib\` to restore the fast path.`,
  })
  return true
}

function tokenConflictDiagnostics(ds: ResolvedDesignSystem, consumerTokenPaths: string[]): Diagnostic[] {
  if (consumerTokenPaths.length === 0 || ds.tokenPaths.length === 0) return []

  const designSystemTokenPaths = new Set(ds.tokenPaths)
  const conflicts = [...new Set(consumerTokenPaths.filter((path) => designSystemTokenPaths.has(path)))].sort()

  return conflicts.map((path) => ({
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
