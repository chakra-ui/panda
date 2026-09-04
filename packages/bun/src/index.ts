import { createNodeDriver, type Diagnostic, type Driver } from '@pandacss/compiler'
import { formatDiagnostic, withDiagnosticFile } from '@pandacss/compiler-shared'
import {
  getInternalCssRuntimeSource,
  INTERNAL_CSS_IMPORT,
  resolveCxSeparator,
  runSourceTransform,
} from '@pandacss/transformer'
import { readFile } from 'node:fs/promises'
import type { BunPlugin, Loader, OnLoadArgs, OnLoadResult } from './types'

export type { BunPlugin, Loader, OnLoadArgs, OnLoadResult, PluginBuilder } from './types'

export interface PandaPluginOptions {
  /** Project root. Defaults to `process.cwd()`. */
  cwd?: string
  /** Explicit config file (relative to `cwd`); otherwise discovered upward. */
  configPath?: string
  /** Where codegen artifacts are written. Defaults to the config `outdir`. */
  outdir?: string
  /**
   * Opt-in source rewrite (`css()` → class strings, etc.). Default: `false`.
   * Codegen and CSS injection always run.
   */
  transform?: boolean
}

// Bun evaluates the filters natively, so node_modules never reach the callbacks.
const SOURCE_FILTER = /^(?!.*[\\/]node_modules[\\/]).*\.[cm]?[jt]sx?$/
const CSS_FILTER = /^(?!.*[\\/]node_modules[\\/]).*\.css$/
const INTERNAL_CSS_FILTER = new RegExp(`^${INTERNAL_CSS_IMPORT}$`)
const INTERNAL_CSS_NAMESPACE = 'panda'

/**
 * Bun plugin for Panda CSS.
 *
 * In `Bun.build` it runs codegen, appends the compiled stylesheet to the CSS
 * file that declares Panda's layers, and optionally rewrites sources. As a
 * runtime plugin (`register()` for `bun run` / `bun test`) Bun never loads CSS,
 * so only codegen and the optional source rewrite apply.
 */
export function pandacss(options: PandaPluginOptions = {}): BunPlugin {
  const prepare = createDriverLoader(options)

  return {
    name: 'pandacss',
    async setup(build) {
      const driver = await prepare()
      // Runtime plugins have no build lifecycle and serve virtual modules through `module()`.
      const runtime = typeof build.onStart !== 'function'

      if (!runtime) {
        build.onLoad({ filter: CSS_FILTER }, (args) => injectStylesheet(driver, args))
      }
      // Runtime plugins must answer every load they match, so without transform they get no source hook.
      if (runtime && !options.transform) return

      const loaded = new Set<string>()
      build.onLoad({ filter: SOURCE_FILTER }, (args) => {
        // Bun's dev server reloads edited modules one by one, so a repeat load means the file changed on disk.
        const changed = loaded.has(args.path)
        loaded.add(args.path)
        return loadSource(driver, args.path, {
          transform: options.transform === true,
          sync: changed,
          // Bun has no way to re-run the CSS file when JS changes, so the hot-reloaded module carries the styles.
          devStyles: changed && !runtime,
        })
      })

      if (!options.transform) return
      if (runtime) {
        build.module(INTERNAL_CSS_IMPORT, () => internalCssModule(driver))
      } else {
        build.onResolve({ filter: INTERNAL_CSS_FILTER }, (args) => ({
          path: args.path,
          namespace: INTERNAL_CSS_NAMESPACE,
        }))
        build.onLoad({ filter: INTERNAL_CSS_FILTER, namespace: INTERNAL_CSS_NAMESPACE }, () =>
          internalCssModule(driver),
        )
      }
    },
  }
}

/**
 * Register the plugin with `Bun.plugin` for `bun run` / `bun test`.
 * Await it in the preload so codegen finishes before the entry loads.
 */
export async function register(options: PandaPluginOptions = {}): Promise<void> {
  const bun = (globalThis as { Bun?: { plugin(plugin: BunPlugin): unknown } }).Bun
  if (!bun) {
    throw new Error('@pandacss/bun: register() needs the Bun runtime. Pass pandacss() to Bun.build instead.')
  }
  await bun.plugin(pandacss(options))
}

/** Ready-made plugin with default options: `plugins: [panda]` in `Bun.build`, `plugins = ["@pandacss/bun"]` in `bunfig.toml`. */
export default pandacss()

/** One driver per plugin. The first build creates it; later builds reload the config and re-parse sources. */
function createDriverLoader(options: PandaPluginOptions) {
  const { configPath, outdir } = options
  let driver: Driver | undefined
  let reportedDesignSystemDiagnostics: readonly Diagnostic[] | undefined

  return async (): Promise<Driver> => {
    const cwd = options.cwd ?? process.cwd()
    if (!driver) {
      driver = await createNodeDriver({ cwd, configPath })
      driver.codegen({ cwd, outdir })
    } else if ((await driver.reload()).hasChanged) {
      driver.codegen({ cwd, outdir })
    }

    for (const report of driver.parseFiles()) {
      warnDiagnostics(report.diagnostics, `while parsing ${report.path}`, report.path)
    }
    if (driver.designSystemDiagnostics !== reportedDesignSystemDiagnostics) {
      reportedDesignSystemDiagnostics = driver.designSystemDiagnostics
      warnDiagnostics(reportedDesignSystemDiagnostics, 'while loading the design system')
    }
    return driver
  }
}

async function injectStylesheet(driver: Driver, args: OnLoadArgs): Promise<OnLoadResult | undefined> {
  const source = await readFile(args.path, 'utf8')
  if (!driver.compiler.hasLayerDeclaration(source)) return
  // In a rebuild the edited modules must sync into the project before the stylesheet is generated.
  await args.defer?.()

  const polyfill = driver.config.polyfill === true
  const output = driver.cssgen({ emitLayerDeclaration: false, polyfill })
  warnDiagnostics(output.diagnostics, 'while compiling the stylesheet')

  const entry = polyfill ? driver.compiler.stripLayerOrderStatements(source) : source
  return { contents: `${entry}\n${output.css}`, loader: 'css' }
}

async function loadSource(
  driver: Driver,
  path: string,
  options: { transform: boolean; sync: boolean; devStyles: boolean },
): Promise<OnLoadResult | undefined> {
  const source = await readFile(path, 'utf8')

  if (options.sync && driver.isSourceFile(path)) {
    driver.applyChange({ path, kind: 'change', content: source })
    warnDiagnostics(driver.compiler.getFile(path)?.diagnostics, `while parsing ${path}`, path)
  }

  let code = source
  if (options.transform) {
    const result = runSourceTransform({}, { compiler: driver.compiler }, source, path)
    if (result) {
      warnDiagnostics(result.diagnostics, 'while transforming source', path)
      code = result.code
    }
  }
  if (options.devStyles) {
    code += devStylesSnippet(driver)
  }
  if (code === source && !options.transform) return

  return { contents: code, loader: loaderFor(path) }
}

/** Writes the current stylesheet into a `<style>` tag, so a hot-reloaded module brings its new styles along. */
function devStylesSnippet(driver: Driver): string {
  const output = driver.cssgen({ emitLayerDeclaration: false, polyfill: driver.config.polyfill === true })
  return [
    '',
    ';(() => {',
    "  if (typeof document === 'undefined') return",
    "  let style = document.getElementById('panda-dev-styles')",
    "  if (!style) { style = document.createElement('style'); style.id = 'panda-dev-styles'; document.head.append(style) }",
    `  style.textContent = ${JSON.stringify(output.css)}`,
    '})()',
    '',
  ].join('\n')
}

function internalCssModule(driver: Driver): OnLoadResult {
  const separator = resolveCxSeparator(driver.compiler.config())
  return { contents: getInternalCssRuntimeSource(separator), loader: 'js' }
}

function loaderFor(path: string): Loader {
  if (/\.[cm]?tsx$/.test(path)) return 'tsx'
  if (/\.[cm]?jsx$/.test(path)) return 'jsx'
  if (/\.[cm]?ts$/.test(path)) return 'ts'
  return 'js'
}

function warnDiagnostics(diagnostics: readonly Diagnostic[] | undefined, context: string, file?: string) {
  if (!diagnostics?.length) return
  const shown = diagnostics
    .slice(0, 3)
    .map((diagnostic) => formatDiagnostic(withDiagnosticFile(diagnostic, file)))
    .join('\n')
  const hidden = diagnostics.length > 3 ? `\n...and ${diagnostics.length - 3} more` : ''
  console.warn(`panda: ${diagnostics.length} diagnostic(s) ${context}\n${shown}${hidden}`)
}
