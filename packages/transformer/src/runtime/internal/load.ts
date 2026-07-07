import { internalCssSource as defaultInternalCssSource } from './source'

/** Marker baked into the default bundle — replaced per-project at load time. */
export const CX_SEPARATOR_PLACEHOLDER = '__PANDA_CX_SEPARATOR__'

const runtimeCache = new Map<string, string>()

export function resolveCxSeparator(config: Record<string, unknown> | undefined): string {
  const raw = config?.separator
  if (typeof raw === 'string' && raw.length > 0) return raw
  return '_'
}

function patchSeparator(source: string, separator: string): string {
  const quoted = JSON.stringify(separator)
  if (source.includes(CX_SEPARATOR_PLACEHOLDER)) {
    return source.split(CX_SEPARATOR_PLACEHOLDER).join(separator)
  }
  return source.replace(/var d="_"/, `var d=${quoted}`)
}

/** Patch the prebuilt virtual `@pandacss-internal/css` module with the project separator. */
export function buildInternalCssRuntimeSource(separator: string, base = defaultInternalCssSource): string {
  return patchSeparator(base, separator)
}

/** Virtual module source for `@pandacss-internal/css`. */
export function getInternalCssRuntimeSource(separator = '_'): string {
  const cached = runtimeCache.get(separator)
  if (cached) return cached

  const source = buildInternalCssRuntimeSource(separator)
  runtimeCache.set(separator, source)
  return source
}
