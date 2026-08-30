import { applyConfigDefaults } from '@pandacss/compiler-shared'
import type { UserConfig } from '@pandacss/types'
import { normalizeClassNameOptions } from '../normalize'
import type { ConfigSources } from '../sources'
import type { ResolvedDesignSystem } from './chain'

export const CLASS_NAME_OPTION_KEYS = ['hash', 'prefix', 'separator'] as const

export const RUNTIME_OPTION_KEYS = [
  ...CLASS_NAME_OPTION_KEYS,
  'jsxFramework',
  'jsxFactory',
  'jsxStyleProps',
  'strictTokens',
  'strictPropertyValues',
  'shorthands',
] as const

export type RuntimeOptionKey = (typeof RUNTIME_OPTION_KEYS)[number]

export interface DesignSystemOverlayInput {
  authored: {
    conditions: boolean
    breakpoints: boolean
    utilities: boolean
    tokens: boolean
  }
  compatible: boolean
}

export function designSystemSourceIds(chain: readonly ResolvedDesignSystem[]): Set<string> {
  const ids = new Set<string>()
  for (const ds of chain) {
    ids.add(ds.name)
    ids.add(ds.specifier)
  }
  return ids
}

export function authoredByApp(sources: ConfigSources, prefix: string, dsIds: ReadonlySet<string>): boolean {
  return Object.entries(sources.paths).some(([path, ids]) => {
    if (path !== prefix && !path.startsWith(`${prefix}.`)) return false
    const idList = Array.isArray(ids) ? ids : [ids]
    return idList.some((id) => isAppSource(sources.entries[id], dsIds))
  })
}

function isAppSource(entry: ConfigSources['entries'][number] | undefined, dsIds: ReadonlySet<string>): boolean {
  if (!entry) return false
  if (entry.kind === 'config') return true
  if (entry.kind !== 'preset') return false
  return entry.specifier === undefined || !dsIds.has(entry.specifier)
}

export function buildOverlayInput(
  sources: ConfigSources,
  appConfig: UserConfig,
  chain: readonly ResolvedDesignSystem[],
  leafPreset: UserConfig,
  cwd?: string,
): DesignSystemOverlayInput {
  const dsIds = designSystemSourceIds(chain)
  const authored = {
    conditions: authoredByApp(sources, 'conditions', dsIds),
    breakpoints: authoredByApp(sources, 'theme.breakpoints', dsIds),
    utilities: authoredByApp(sources, 'utilities', dsIds),
    tokens: authoredByApp(sources, 'theme.tokens', dsIds) || authoredByApp(sources, 'theme.semanticTokens', dsIds),
  }
  const mismatches = diffRuntimeOptions(appConfig, leafPreset, sources, dsIds, cwd)
  return { authored, compatible: mismatches.length === 0 }
}

export function diffRuntimeOptions(
  appConfig: UserConfig,
  leafPreset: UserConfig,
  sources: ConfigSources,
  dsIds: ReadonlySet<string>,
  cwd?: string,
): RuntimeOptionKey[] {
  const app = applyConfigDefaults({ ...appConfig }, cwd)
  const ds = applyConfigDefaults({ ...leafPreset }, cwd)
  const appClass = normalizeClassNameOptions(app)
  const dsClass = normalizeClassNameOptions(ds)

  return RUNTIME_OPTION_KEYS.filter((key) => {
    if (!authoredByApp(sources, key, dsIds)) return false

    if (key === 'hash' || key === 'prefix' || key === 'separator') {
      if (key === 'separator') return appClass.separator !== dsClass.separator
      return appClass[key].cssVar !== dsClass[key].cssVar || appClass[key].className !== dsClass[key].className
    }

    return JSON.stringify(app[key]) !== JSON.stringify(ds[key])
  })
}
