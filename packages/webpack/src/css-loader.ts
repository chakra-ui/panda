import type { Diagnostic, Driver } from '@pandacss/compiler'
import {
  appendPandaStylesheet,
  findImportedLayerDeclaration,
  formatDiagnostic,
  withDiagnosticFile,
} from '@pandacss/compiler-shared'
import { readFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { LoaderContext } from 'webpack'

/** Options the plugin passes to this loader — a live handle to the driver. */
export interface PandaCssLoaderOptions {
  getDriver: () => Driver | undefined
}

/**
 * `pre` loader for `.css` files. When a stylesheet declares Panda layers
 * (`@layer reset, base, …;`) or `@import`s a file that does, append the generated CSS in-memory — the webpack
 * analog of the Vite plugin's `.css` transform. No file is written to disk.
 * Registers project sources, config deps, and design-system watch targets so
 * webpack rebuilds this stylesheet when they change.
 */
export default function pandaCssLoader(this: LoaderContext<PandaCssLoaderOptions>, source: string): string | void {
  const driver = this.getOptions().getDriver()
  if (!driver) return source
  if (driver.compiler.hasLayerDeclaration(source)) return injectStylesheet(this, driver, source)
  if (!source.includes('@import')) return source

  const callback = this.async()
  importsLayerDeclaration(this, driver, source).then(
    (found) => callback(null, found ? injectStylesheet(this, driver, source) : source),
    (error: Error) => callback(error),
  )
}

const CSS_RESOLVE_OPTIONS = {
  dependencyType: 'css',
  conditionNames: ['style', '...'],
  mainFields: ['css', 'style', 'main', '...'],
  mainFiles: ['index', '...'],
  extensions: ['.css', '...'],
  preferRelative: true,
}

async function importsLayerDeclaration(loader: LoaderContext<PandaCssLoaderOptions>, driver: Driver, source: string) {
  const resolve = loader.getResolve(CSS_RESOLVE_OPTIONS)
  const imported = await findImportedLayerDeclaration(source, loader.resourcePath, {
    resolve: (specifier, importer) => resolve(dirname(importer), specifier).catch(() => undefined),
    read: (file) => readFile(file, 'utf8'),
    hasLayerDeclaration: (css) => driver.compiler.hasLayerDeclaration(css),
  })
  for (const file of imported.files) loader.addDependency(file)
  return imported.found
}

function injectStylesheet(loader: LoaderContext<PandaCssLoaderOptions>, driver: Driver, source: string) {
  addPandaDependencies(loader, driver)
  warnDiagnostics(loader, driver.designSystemDiagnostics, 'while loading the design system')

  const stylesheet = appendPandaStylesheet(driver, source)
  warnDiagnostics(loader, stylesheet.diagnostics, 'while compiling the stylesheet')
  return stylesheet.code
}

function addPandaDependencies(
  loader: Pick<LoaderContext<PandaCssLoaderOptions>, 'addDependency' | 'addContextDependency'>,
  driver: Driver,
) {
  const seen = new Set<string>()
  const watch = (file: string) => {
    if (seen.has(file)) return
    seen.add(file)
    loader.addDependency(file)
  }

  const watchTargets = driver.watchTargets()
  for (const file of driver.scan()) watch(file)
  // Lets webpack report newly created files.
  for (const dir of watchTargets.dirs) {
    loader.addContextDependency(driver.resolvePath(dir))
  }
  for (const dep of watchTargets.config) {
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
