import type { Diagnostic, Driver } from '@pandacss/compiler'
import { formatDiagnostic, withDiagnosticFile } from '@pandacss/compiler-shared'
import type { LoaderContext } from 'webpack'

/** Options the plugin passes to this loader — a live handle to the driver. */
export interface PandaCssLoaderOptions {
  getDriver: () => Driver | undefined
}

/**
 * `pre` loader for `.css` files. When a stylesheet declares Panda layers
 * (`@layer reset, base, …;`), append the generated CSS in-memory — the webpack
 * analog of the Vite plugin's `.css` transform. No file is written to disk.
 * Registers project sources, config deps, and design-system watch targets so
 * webpack rebuilds this stylesheet when they change.
 */
export default function pandaCssLoader(this: LoaderContext<PandaCssLoaderOptions>, source: string): string {
  const driver = this.getOptions().getDriver()
  if (!driver || !driver.compiler.hasLayerDeclaration(source)) return source

  addPandaDependencies(this, driver)
  warnDiagnostics(this, driver.designSystemDiagnostics, 'while loading the design system')

  const polyfill = driver.config.polyfill === true
  const output = driver.cssgen({ emitLayerDeclaration: false, polyfill })
  warnDiagnostics(this, output.diagnostics, 'while compiling the stylesheet')

  const entry = polyfill ? driver.compiler.stripLayerOrderStatements(source) : source
  return `${entry}\n${output.css}`
}

function addPandaDependencies(loader: Pick<LoaderContext<PandaCssLoaderOptions>, 'addDependency'>, driver: Driver) {
  const seen = new Set<string>()
  const watch = (file: string) => {
    if (seen.has(file)) return
    seen.add(file)
    loader.addDependency(file)
  }

  for (const file of driver.scan()) watch(file)
  for (const dep of driver.watchTargets().config) {
    watch(driver.resolvePath(dep))
  }
  if (driver.configPath) {
    watch(driver.configPath)
  }
  for (const target of driver.designSystemWatchTargets?.() ?? []) {
    watch(target.manifestPath)
    watch(target.buildInfoPath)
    watch(target.presetPath)
    for (const file of target.sourceFiles) {
      watch(file)
    }
  }
}

function warnDiagnostics(
  loader: Pick<LoaderContext<PandaCssLoaderOptions>, 'emitWarning'>,
  diagnostics: readonly Diagnostic[] | undefined,
  context: string,
) {
  if (!diagnostics?.length) return
  const shown = diagnostics
    .slice(0, 3)
    .map((diagnostic) => formatDiagnostic(withDiagnosticFile(diagnostic)))
    .join('\n')
  const hidden = diagnostics.length > 3 ? `\n...and ${diagnostics.length - 3} more` : ''
  loader.emitWarning(new Error(`panda: ${diagnostics.length} diagnostic(s) ${context}\n${shown}${hidden}`))
}
