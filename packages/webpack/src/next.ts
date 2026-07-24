import { PandaWebpackPlugin, type PandaWebpackPluginOptions } from './index'

type WebpackConfig = { plugins: unknown[] }
type NextConfig = {
  webpack?: (config: WebpackConfig, context: unknown) => WebpackConfig
  [key: string]: unknown
}

/**
 * Wrap a Next.js config to run Panda's webpack plugin. Composes with any
 * existing `webpack` function. Only affects the webpack build — Turbopack needs
 * its own integration. Pass `transform: true` in `pandaOptions` to enable
 * source rewrite.
 */
export function withPandaCss(nextConfig: NextConfig = {}, pandaOptions: PandaWebpackPluginOptions = {}): NextConfig {
  // One instance shared across Next's server/client/edge compilers so the
  // driver (codegen, parse, stylesheet) is built once.
  const plugin = new PandaWebpackPlugin(pandaOptions)
  return {
    ...nextConfig,
    webpack(config: WebpackConfig, context: unknown) {
      config.plugins.push(plugin)
      return typeof nextConfig.webpack === 'function' ? nextConfig.webpack(config, context) : config
    },
  }
}

export default withPandaCss
