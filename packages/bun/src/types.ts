/**
 * The slice of Bun's plugin API this package uses, mirrored structurally so
 * the plugin type-checks and unit-tests without `bun-types`.
 */

export type Loader = 'js' | 'jsx' | 'ts' | 'tsx' | 'css'

export interface PluginConstraints {
  filter: RegExp
  namespace?: string
}

export interface OnResolveArgs {
  path: string
  importer: string
}

export interface OnResolveResult {
  path: string
  namespace?: string
}

export interface OnLoadArgs {
  path: string
  namespace?: string
  /** `Bun.build` only. Resolves once every other module in the build has loaded. */
  defer?: () => Promise<void>
}

export interface OnLoadResult {
  contents: string
  loader: Loader
}

export interface PluginBuilder {
  /** `Bun.build` only. Runtime plugins registered through `Bun.plugin` have no build lifecycle. */
  onStart?(callback: () => void | Promise<void>): void
  onResolve(constraints: PluginConstraints, callback: (args: OnResolveArgs) => OnResolveResult | undefined): void
  onLoad(
    constraints: PluginConstraints,
    callback: (args: OnLoadArgs) => OnLoadResult | undefined | Promise<OnLoadResult | undefined>,
  ): void
  /** Runtime only. `Bun.build` throws on `module()`. */
  module(specifier: string, callback: () => OnLoadResult | Promise<OnLoadResult>): void
}

export interface BunPlugin {
  name: string
  setup(build: PluginBuilder): void | Promise<void>
}
