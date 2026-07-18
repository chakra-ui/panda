import { type BuildInfoArtifact, type Compiler, type Diagnostic } from '@pandacss/compiler-shared'
import {
  collectArtifactConflicts,
  readPandaVersion,
  type LoadConfigResult,
  type ResolvedDesignSystem,
} from '@pandacss/config'

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

type BuildInfoIssue =
  | { kind: 'read'; detail: string }
  | { kind: 'schemaVersion'; received: unknown; expected: number }
  | { kind: 'corrupt' }

type FallbackDiagnostic = (sourceCount: number, severity: 'warning' | 'error') => Diagnostic

export interface HydrateDesignSystemOptions {
  chain: ResolvedDesignSystem[] | undefined
  consumerTokenPaths?: string[]
  /** Narrow hydrate to export names imported from each design-system package. */
  treeshake?: boolean
  /** Precomputed selections — skips a second scan (watch sync). */
  importSelections?: Array<string[] | null>
}

export interface HydrateDesignSystemResult {
  diagnostics: Diagnostic[]
  /** Fingerprint of import selections — empty when treeshake is off. */
  treeshakeKey: string
}

/** Hydrate each design-system level. With `treeshake`, one scan feeds every package. */
export function hydrateDesignSystem(
  compiler: Compiler,
  options: HydrateDesignSystemOptions,
): HydrateDesignSystemResult {
  const { chain, consumerTokenPaths = [], treeshake, importSelections } = options
  if (!chain || chain.length === 0) {
    return { diagnostics: [], treeshakeKey: '' }
  }

  const pandaVersion = readPandaVersion()
  const diagnostics: Diagnostic[] = []
  const selections = treeshake ? importSelections ?? collectImportSelections(compiler, chain) : undefined

  for (let i = 0; i < chain.length; i++) {
    const ds = chain[i]!
    const imports = selections ? selections[i] ?? undefined : undefined
    diagnostics.push(...hydrateLevel(compiler, ds, pandaVersion, consumerTokenPaths, imports))
  }

  return {
    diagnostics,
    treeshakeKey: treeshakeKeyFromSelections(chain, selections),
  }
}

/** One scan for the whole chain. `null` = full hydrate; `string[]` = narrow. */
export function collectImportSelections(compiler: Compiler, chain: ResolvedDesignSystem[]): Array<string[] | null> {
  return compiler.designSystemImportSelections(
    chain.map((ds) => ({
      packageRoots: getPackageRoots(ds),
      excludeModules: getExcludedModules(ds),
    })),
  )
}

export function treeshakeKeyFromSelections(
  chain: ResolvedDesignSystem[],
  selections: Array<string[] | null> | undefined,
): string {
  if (!selections?.length) return ''
  return chain.map((ds, i) => `${ds.name}:${JSON.stringify(selections[i] ?? null)}`).join('|')
}

const STYLED_SYSTEM_SUBPATHS = ['css', 'recipes', 'patterns', 'jsx', 'tokens'] as const

function getPackageRoots(ds: ResolvedDesignSystem): string[] {
  return [...new Set([ds.specifier, ds.name].filter((value): value is string => Boolean(value)))]
}

/** Always exclude conventional styled-system subpaths (+ manifest importMap). */
function getExcludedModules(ds: ResolvedDesignSystem): string[] {
  const excluded = new Set<string>()
  for (const root of getPackageRoots(ds)) {
    for (const sub of STYLED_SYSTEM_SUBPATHS) {
      excluded.add(`${root}/${sub}`)
    }
  }
  const map = ds.importMap
  if (map) {
    for (const value of [map.css, map.recipes, map.patterns, map.jsx, map.tokens]) {
      if (typeof value === 'string' && value.length > 0) excluded.add(value)
    }
  }
  return [...excluded]
}

function hydrateLevel(
  compiler: Compiler,
  ds: ResolvedDesignSystem,
  pandaVersion: string | undefined,
  consumerTokenPaths: string[],
  imports: string[] | undefined,
): Diagnostic[] {
  const compat = compiler.designSystem.validate(ds.manifest, { pandaVersion })

  if (!compat.ok) {
    throw incompatibleManifestError(compiler, ds, compat.reason, pandaVersion)
  }

  const diagnostics = hydrateArtifacts(compiler, ds, pandaVersion, imports)

  diagnostics.push(...tokenConflictDiagnostics(ds, consumerTokenPaths))

  return diagnostics
}

function hydrateArtifacts(
  compiler: Compiler,
  ds: ResolvedDesignSystem,
  pandaVersion: string | undefined,
  imports: string[] | undefined,
): Diagnostic[] {
  if (ds.optionMismatch && ds.optionMismatch.length > 0) {
    const diagnostic = recoverFromSources(compiler, ds, (sourceCount, severity) =>
      optionMismatchDiagnostic(ds, sourceCount, severity),
    )

    return [diagnostic]
  }

  let buildInfo: BuildInfoArtifact

  try {
    const content = compiler.fs.readFile(ds.buildInfoPath)

    if (content == null) {
      throw new Error('file not found')
    }

    buildInfo = JSON.parse(content) as BuildInfoArtifact
  } catch (error) {
    const issue: BuildInfoIssue = { kind: 'read', detail: errorMessage(error) }
    const diagnostic = recoverFromSources(compiler, ds, (sourceCount, severity) =>
      buildInfoDiagnostic(ds, issue, sourceCount, severity),
    )

    return [diagnostic]
  }

  const result = compiler.designSystem.load(ds.manifest, {
    buildInfo,
    pandaVersion,
    ...(imports !== undefined ? { imports } : {}),
  })

  if (!result.ok) {
    const issue: BuildInfoIssue =
      result.reason === 'schemaVersion'
        ? {
            kind: 'schemaVersion',
            received: buildInfo.schemaVersion,
            expected: compiler.buildInfo.schemaVersion,
          }
        : { kind: 'corrupt' }
    const diagnostic = recoverFromSources(compiler, ds, (sourceCount, severity) =>
      buildInfoDiagnostic(ds, issue, sourceCount, severity),
    )

    return [diagnostic]
  }

  return []
}

function recoverFromSources(
  compiler: Compiler,
  ds: ResolvedDesignSystem,
  createDiagnostic: FallbackDiagnostic,
): Diagnostic {
  const sources = extractFallbackSources(compiler, ds)
  const severity = sources.length === 0 ? 'error' : 'warning'
  const diagnostic = createDiagnostic(sources.length, severity)

  if (sources.length === 0) {
    throw diagnosticError(diagnostic)
  }

  compiler.parseFiles(sources)

  return diagnostic
}

function extractFallbackSources(compiler: Compiler, ds: ResolvedDesignSystem) {
  if (ds.files.length === 0) {
    return []
  }

  return compiler.scan({ include: ds.files, cwd: compiler.path.dirname(ds.manifestPath) })
}

function buildInfoDiagnostic(
  ds: ResolvedDesignSystem,
  issue: BuildInfoIssue,
  sourceCount: number,
  severity: 'warning' | 'error',
): Diagnostic {
  const reason = buildInfoIssueMessage(issue)
  const outcome =
    sourceCount > 0
      ? ` Re-extracted ${sourceCount} source ${sourceCount === 1 ? 'file' : 'files'}.`
      : ' No fallback source files were available.'

  return {
    code: 'design_system_buildinfo_stale',
    severity,
    category: 'designSystem',
    file: ds.buildInfoPath,
    message: `${JSON.stringify(ds.name)} build info ${reason}.${outcome}`,
    help: [`Run \`panda lib\` in ${JSON.stringify(ds.name)} to rebuild panda.buildinfo.json.`],
  }
}

function buildInfoIssueMessage(issue: BuildInfoIssue): string {
  if (issue.kind === 'schemaVersion') {
    return `uses schemaVersion ${formatValue(issue.received)}; expected ${issue.expected}`
  }

  if (issue.kind === 'read') {
    return `could not be read: ${issue.detail}`
  }

  return 'is malformed or corrupt'
}

function optionMismatchDiagnostic(
  ds: ResolvedDesignSystem,
  sourceCount: number,
  severity: 'warning' | 'error',
): Diagnostic {
  const options = ds.optionMismatch?.join(', ') ?? 'class-name options'
  const outcome =
    sourceCount > 0
      ? ` Re-extracted ${sourceCount} source ${sourceCount === 1 ? 'file' : 'files'} with the consumer options.`
      : ' No fallback source files were available, so the prebuilt class names cannot be used safely.'

  return {
    code: 'design_system_option_mismatch',
    severity,
    category: 'designSystem',
    file: ds.manifestPath,
    message: `${JSON.stringify(ds.name)} was built with different ${options}.${outcome}`,
    help: [`Match ${options} with ${JSON.stringify(ds.name)}, or rebuild it with \`panda lib\`.`],
  }
}

function tokenConflictDiagnostics(ds: ResolvedDesignSystem, consumerTokenPaths: string[]): Diagnostic[] {
  if (consumerTokenPaths.length === 0 || ds.tokenPaths.length === 0) {
    return []
  }

  const designSystemTokenPaths = new Set(ds.tokenPaths)
  const conflicts = [...new Set(consumerTokenPaths.filter((path) => designSystemTokenPaths.has(path)))].sort()

  if (conflicts.length === 0) {
    return []
  }

  const preview = conflicts
    .slice(0, 3)
    .map((path) => JSON.stringify(path))
    .join(', ')
  const remainder = conflicts.length > 3 ? ` and ${conflicts.length - 3} more` : ''

  return [
    {
      code: 'design_system_token_conflict',
      severity: 'info',
      category: 'designSystem',
      file: ds.manifestPath,
      message: `${conflicts.length} token ${conflicts.length === 1 ? 'path is' : 'paths are'} defined by both ${JSON.stringify(ds.name)} and this config (${preview}${remainder}); the local values win.`,
    },
  ]
}

function incompatibleManifestError(
  compiler: Compiler,
  ds: ResolvedDesignSystem,
  reason: 'schemaVersion' | 'pandaRange',
  pandaVersion?: string,
): Error {
  if (reason === 'schemaVersion') {
    return diagnosticError({
      code: 'design_system_version_mismatch',
      severity: 'error',
      category: 'designSystem',
      file: ds.manifestPath,
      message: `${JSON.stringify(ds.name)} panda.lib.json uses schemaVersion ${ds.manifest.schemaVersion}; expected ${compiler.designSystem.schemaVersion}.`,
      help: [`Upgrade ${JSON.stringify(ds.name)}, or rebuild it with a compatible version of Panda.`],
    })
  }

  const running = pandaVersion ? `; the consumer uses ${pandaVersion}` : ''

  return diagnosticError({
    code: 'design_system_peer_range_unsatisfied',
    severity: 'error',
    category: 'designSystem',
    file: ds.manifestPath,
    message: `${JSON.stringify(ds.name)} requires Panda ${ds.manifest.panda}${running}.`,
    help: [`Install a compatible Panda version or update ${JSON.stringify(ds.name)}.`],
  })
}

function diagnosticError(diagnostic: Diagnostic): Error {
  const error = new Error(diagnostic.message) as Error & { diagnostics: Diagnostic[] }

  error.diagnostics = [diagnostic]

  return error
}

function formatValue(value: unknown): string {
  return typeof value === 'number' || typeof value === 'string' ? JSON.stringify(value) : String(value)
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
