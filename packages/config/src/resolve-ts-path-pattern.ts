import { posix, sep } from 'path'
import type { PathMapping } from './ts-config-paths'

/**
 * @see https://github.com/aleclarson/vite-tsconfig-paths/blob/e8f0acf7adfcfbf77edbe937f64b4e5d39557ad0/src/index.ts#LL231C57-L231C57
 */

export const resolveTsPathPattern = (pathMappings: PathMapping[], moduleSpecifier: string) => {
  for (const mapping of pathMappings) {
    const match = moduleSpecifier.match(mapping.pattern)
    if (!match) {
      continue
    }
    for (const pathTemplate of mapping.paths) {
      let starCount = 0
      const mappedId = pathTemplate.replace(/\*/g, () => {
        // There may exist more globs in the path template than in
        // the match pattern. In that case, we reuse the final
        // glob match.
        const matchIndex = Math.min(++starCount, match.length - 1)
        return match[matchIndex]
      })

      return mappedId.split(sep).join(posix.sep)
    }
  }
}
