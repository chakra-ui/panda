import { isAbsolute } from 'node:path'
import { pathToFileURL } from 'node:url'

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
