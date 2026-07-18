import { outdirBasename } from '@pandacss/compiler-shared'
import type { ImportMapOutput } from '@pandacss/types'

export interface ResolveModuleTargetOptions {
  outdir: string
}

// Only redirects the default bare-outdir convention (`{outdirBasename}/css`, etc. — see
// normalizeImportMapInput's fallback) to a real relative path TS can resolve on disk.
// Real npm packages (@acme/ui/css) and explicit relative roots (./styled-system/css)
// already resolve without help; a custom bare alias that isn't the outdir basename is a
// known gap here, not yet handled.
export function resolveModuleTarget(
  specifier: string,
  importMap: ImportMapOutput,
  options: ResolveModuleTargetOptions,
): string | undefined {
  const outdirBase = outdirBasename(options.outdir)
  const roots = Object.values(importMap).flat()
  const usesBareOutdirConvention = roots.some((root) => root === outdirBase || root.startsWith(`${outdirBase}/`))
  if (!usesBareOutdirConvention) return undefined

  if (specifier !== outdirBase && !specifier.startsWith(`${outdirBase}/`)) return undefined
  return `./${options.outdir}${specifier.slice(outdirBase.length)}`
}
