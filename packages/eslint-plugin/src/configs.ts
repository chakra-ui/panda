import {
  extractionDiagnosticsRuleName,
  fileNotIncludedRuleName,
  noDebugRuleName,
  noDeprecatedRuleName,
  noInvalidTokenPathsRuleName,
  preferTokenRuleName,
} from './rules'
import type { RuleModuleLike } from './rules/shared'
import { type PandaPluginOptions, bindRules, loadPandaProject } from './plugin'

/** Flat-config plugin key; rule ids are `@pandacss/<rule>`. */
export const PLUGIN_NAMESPACE = '@pandacss'

type RuleSeverity = 'off' | 'warn' | 'error'
type RuleEntry = RuleSeverity | [RuleSeverity, Record<string, unknown>]

const RECOMMENDED_RULES: Record<string, RuleEntry> = {
  [extractionDiagnosticsRuleName]: 'warn',
  [fileNotIncludedRuleName]: 'error',
  [noInvalidTokenPathsRuleName]: 'error',
  [noDeprecatedRuleName]: 'warn',
  [noDebugRuleName]: 'warn',
  // Default to flagging hardcoded colors only (the old `no-hardcoded-color`);
  // widen with `categories` to enforce other token categories.
  [preferTokenRuleName]: ['warn', { categories: ['colors'] }],
}

export interface PandaFlatConfig {
  plugins: Record<string, { meta: { name: string }; rules: Record<string, RuleModuleLike> }>
  rules: Record<string, RuleEntry>
  settings?: { panda: { configPath: string } }
}

/**
 * Build the recommended flat config. Async because it preloads the Panda
 * project (config load + compiler) so rule visitors can run synchronously.
 *
 * ```ts
 * import panda from '@pandacss/eslint-plugin'
 *
 * export default [
 *   await panda.configs.recommended({ configPath: './panda.config.ts' }),
 * ]
 * ```
 */
export async function recommended(options: PandaPluginOptions = {}): Promise<PandaFlatConfig> {
  const { linter, project } = await loadPandaProject(options)
  const rules = bindRules(linter, project)
  const plugin = { meta: { name: '@pandacss/eslint-plugin' }, rules }

  return {
    plugins: { [PLUGIN_NAMESPACE]: plugin },
    rules: Object.fromEntries(
      Object.entries(RECOMMENDED_RULES).map(([id, severity]) => [`${PLUGIN_NAMESPACE}/${id}`, severity]),
    ),
    ...(options.configPath ? { settings: { panda: { configPath: options.configPath } } } : {}),
  }
}

export const configs = { recommended }
