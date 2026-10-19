import { isAbsolute } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Plugin } from 'rolldown'

/**
 * Replace `import.meta.url` in each bundled module with its source file URL, so
 * the resolved config sees the real path rather than the bundle output's.
 */
export function importMetaUrlPlugin() {
  return {
    name: 'panda-import-meta-url',
    async transform(code: string, id: string) {
      if (!isAbsolute(id) || !code.includes('import.meta.url')) return

      const { replaceImportMetaUrl } = await import('./import-meta-url')
      const replacement = JSON.stringify(pathToFileURL(id).href)
      const patched = replaceImportMetaUrl(code, replacement)
      if (patched === code) return

      return { code: patched, map: null }
    },
  }
}

const sideEffectImportRe = /^[ \t]*import[ \t]*(['"])([^'"\n]+)\1/gm
const nodeModulesRe = /[\\/]node_modules[\\/]/

/**
 * Keep `import 'x'` in the user's own files even when `x` declares `sideEffects: false`,
 * since that import exists only to run it.
 */
export function sideEffectImportsPlugin(): Plugin {
  const importsByFile = new Map<string, Set<string>>()
  return {
    name: 'panda-side-effect-imports',
    transform(code, id) {
      if (nodeModulesRe.test(id) || !code.includes('import')) return
      const specifiers = new Set(Array.from(code.matchAll(sideEffectImportRe), (match) => match[2]))
      if (specifiers.size > 0) importsByFile.set(id, specifiers)
    },
    async resolveId(source, importer) {
      if (!importer || !importsByFile.get(importer)?.has(source)) return
      const resolved = await this.resolve(source, importer, { skipSelf: true })
      return resolved && { ...resolved, moduleSideEffects: true }
    },
  }
}
