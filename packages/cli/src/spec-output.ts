import type { Driver } from '@pandacss/compiler'

export interface WriteSpecOptions {
  outdir?: string
  /** Where a bare `--spec` lands when the artifact's own path isn't right. */
  defaultOutfile?: string
}

/** Whether `--spec` was passed in any form. Also gates config source tracking. */
export function specRequested(flag: boolean | string | undefined): boolean {
  return flag !== undefined && flag !== false
}

/** `--spec` writes the spec; `--spec=<file>` puts it where you say. A bare one
 *  arrives as `''` — see `OPTIONAL_VALUE_FLAGS` in `args.ts`. */
export function writeSpec(
  driver: Driver,
  flag: boolean | string | undefined,
  options: WriteSpecOptions = {},
): string[] {
  if (!specRequested(flag)) return []

  const explicit = typeof flag === 'string' && flag.length > 0 ? flag : undefined
  return driver.spec({ outfile: explicit ?? options.defaultOutfile, outdir: options.outdir })
}
