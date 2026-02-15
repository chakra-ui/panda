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
   * Inline all Panda calls (css, cva, sva, patterns, JSX) at build time.
   * - true (default): inline everything, only unresolvable expressions fall back to runtime
   * - false: CSS generation only, no JS transforms (like PostCSS mode)
   *
   * Note: Not yet implemented. Reserved for Phase 2.
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

export default function pandacss(options: PandaViteOptions = {}): Plugin[] {
  const state: {
    root: Root | null
    server: ViteDevServer | null
    config: ResolvedConfig | null
  } = {
    root: null,
    server: null,
    config: null,
  }

  return [createScanPlugin(options, state), createServePlugin(options, state), createBuildPlugin(options, state)]
}
