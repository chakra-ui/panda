import type { Driver } from '@pandacss/compiler'
import type { LoaderContext } from 'webpack'

/** Options the plugin passes to this loader — a live handle to the driver. */
export interface PandaCssLoaderOptions {
  getDriver: () => Driver | undefined
}

/**
 * `pre` loader for `.css` files. When a stylesheet declares Panda layers
 * (`@layer reset, base, …;`), append the generated CSS in-memory — the webpack
 * analog of the Vite plugin's `.css` transform. No file is written to disk.
 * Registers every source file (and the config) as a dependency so webpack
 * rebuilds this stylesheet when they change.
 */
export default function pandaCssLoader(this: LoaderContext<PandaCssLoaderOptions>, source: string): string {
  const driver = this.getOptions().getDriver()
  if (!driver || !driver.compiler.hasLayerDeclaration(source)) return source

  for (const file of driver.scan()) this.addDependency(file)
  if (driver.configPath) this.addDependency(driver.configPath)

  const { css } = driver.cssgen({ emitLayerDeclaration: false })
  return `${source}\n${css}`
}
