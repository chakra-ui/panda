import {
  extractionDiagnosticsRuleName,
  fileNotIncludedRuleName,
  noDebugRuleName,
  noDeprecatedRuleName,
  noInvalidTokenPathsRuleName,
  preferTokenRuleName,
} from './rules'
import type { RuleModuleLike } from './rules/shared'
import { type PandaPluginOptions, bindRules, loadPandaProject, pluginMeta } from './plugin'

/** Flat-config plugin key; rule ids are `@pandacss/<rule>`. */
export const PLUGIN_NAMESPACE = '@pandacss'

// JS/TS/JSX only. Framework files (.vue/.svelte/.astro) need their own parser
// and whole-file range mapping, so opt them in via the `files` option.
const DEFAULT_FILES = ['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}']

type RuleSeverity = 'off' | 'warn' | 'error'
type RuleEntry = RuleSeverity | [RuleSeverity, Record<string, unknown>]

export interface RecommendedOptions extends PandaPluginOptions {
  /** File globs to lint; defaults to source extensions. */
  files?: string[]
}

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
  files: string[]
  plugins: Record<string, { meta: { name: string; version?: string }; rules: Record<string, RuleModuleLike> }>
  rules: Record<string, RuleEntry>
  settings?: { panda: { configPath: string } }
}

/**
 * Build the recommended flat config. Async because it preloads the Panda
 * project (config load + compiler) so rule visitors can run synchronously.
 *
 * Scopes itself to JS/TS/JSX via `files` but sets no parser — use your
 * project's existing parser setup so ESLint can parse the files.
 *
 * ```ts
 * import panda from '@pandacss/eslint-plugin'
 *
 * export default [
 *   await panda.configs.recommended({ configPath: './panda.config.ts' }),
 * ]
 * ```
 */
export async function recommended(options: RecommendedOptions = {}): Promise<PandaFlatConfig> {
  const { linter, project } = await loadPandaProject(options)
  const rules = bindRules(linter, project)
  const plugin = { meta: pluginMeta, rules }

  return {
    files: options.files ?? DEFAULT_FILES,
    plugins: { [PLUGIN_NAMESPACE]: plugin },
    rules: Object.fromEntries(
      Object.entries(RECOMMENDED_RULES).map(([id, severity]) => [`${PLUGIN_NAMESPACE}/${id}`, severity]),
    ),
    ...(options.configPath ? { settings: { panda: { configPath: options.configPath } } } : {}),
  }
}

export const configs = { recommended }
