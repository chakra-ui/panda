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
