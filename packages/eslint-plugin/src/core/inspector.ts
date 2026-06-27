import type { Compiler, FileInspectionResult } from '@pandacss/compiler'

export interface InspectionCacheEntry {
  sourceKey: string
  result: FileInspectionResult
}

export class Inspector {
  #entries = new WeakMap<Compiler, Map<string, InspectionCacheEntry>>()

  inspect(compiler: Compiler, path: string, source: string): FileInspectionResult {
    let byPath = this.#entries.get(compiler)
    if (!byPath) {
      byPath = new Map()
      this.#entries.set(compiler, byPath)
    }

    const sourceKey = sourceCacheKey(source)
    const cached = byPath.get(path)
    if (cached?.sourceKey === sourceKey) return cached.result

    const result = compiler.inspectFile({ path, source })
    byPath.set(path, { sourceKey, result })
    return result
  }

  clear(compiler?: Compiler): void {
    if (compiler) {
      this.#entries.delete(compiler)
      return
    }
    this.#entries = new WeakMap()
  }
}

export function sourceCacheKey(source: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < source.length; i++) {
    hash ^= source.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return `${source.length}:${hash >>> 0}`
}
