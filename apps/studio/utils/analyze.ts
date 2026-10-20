export const SOURCE_EXT = ['.ts', '.tsx', '.js', '.jsx', '.vue', '.astro', '.svelte', '.mdx']

export function isSourceFile(name: string): boolean {
  return SOURCE_EXT.some((e) => name.endsWith(e)) && !name.endsWith('.d.ts')
}

const IGNORED_DIR =
  /(^|\/)(node_modules|\.git|styled-system|dist|build|out|\.next|\.nuxt|\.output|\.turbo|\.vercel|\.svelte-kit|\.astro|coverage|\.cache)(\/|$)/

export const MAX_FILE_BYTES = 1_500_000
export const MAX_FILES = 6000

export function isIgnoredPath(path: string): boolean {
  return IGNORED_DIR.test(path)
}
