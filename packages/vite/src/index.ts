import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite'
import { createBuildPlugin } from './plugins/build'
import { createScanPlugin } from './plugins/scan'
import { createServePlugin } from './plugins/serve'
import type { Root } from './root'

export interface PandaViteOptions {
  /** Path to panda.config.ts. Auto-detected if omitted. */
  configPath?: string

  /** Current working directory. Defaults to process.cwd(). */
  cwd?: string

  /**
   * Inline Panda calls at build time, replacing them with pre-resolved className strings.
   * - true (default): inline css() and pattern calls, eliminating runtime overhead
   * - false: CSS generation only, no JS transforms (like PostCSS mode)
   */
  optimizeJs?: boolean

  /**
   * Run codegen automatically on server start.
   * @default true
   */
  codegen?: boolean

  /**
   * File include patterns for source file extraction.
   * @default /\.[cm]?[jt]sx?$/
   */
  include?: RegExp | RegExp[]

  /**
   * File exclude patterns for source file extraction.
   * @default /node_modules|styled-system/
   */
  exclude?: RegExp | RegExp[]
}

export interface PluginState {
  /** Root instances keyed by environment name (e.g. 'client', 'ssr') */
  roots: Map<string, Root>
  server: ViteDevServer | null
  config: ResolvedConfig | null
  /** True when Vite is configured with css.transformer: 'lightningcss' */
  viteUsesLightningCss: boolean
}

/**
 * Get the Root for a given environment name, with fallbacks:
 * 1. exact envName match
 * 2. 'client' key
 * 3. first available Root
 */
export function getRoot(state: PluginState, envName?: string): Root | undefined {
  if (envName && state.roots.has(envName)) return state.roots.get(envName)
  if (state.roots.has('client')) return state.roots.get('client')
  const first = state.roots.values().next()
  return first.done ? undefined : first.value
}

export default function pandacss(options: PandaViteOptions = {}): Plugin[] {
  const state: PluginState = {
    roots: new Map(),
    server: null,
    config: null,
    viteUsesLightningCss: false,
  }

  return [createScanPlugin(options, state), createServePlugin(options, state), createBuildPlugin(options, state)]
}
