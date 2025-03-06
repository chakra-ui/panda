import { join } from 'path'
import picomatch from 'picomatch'

export function globDirname(globs: string[]) {
  const rootDirs = new Set<string>()

  for (const glob of globs) {
    const scan = picomatch.scan(glob, { tokens: true })
    if (!scan.isGlob) {
      rootDirs.add(glob)
      continue
    }
    const nonGlobTokens = scan.tokens?.filter((token: any) => !token.isPrefix && !token.isGlob)
    if (nonGlobTokens?.length) {
      rootDirs.add(join(...nonGlobTokens.map((token: any) => token.value)))
    }
  }

  if (rootDirs.size === 0) {
    return ['.']
  }

  return Array.from(rootDirs)
}
