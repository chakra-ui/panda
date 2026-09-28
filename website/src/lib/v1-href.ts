import { v1DocsRedirects } from '../../redirects.mjs'

export const V1_URL =
  process.env.NEXT_PUBLIC_V1_URL ?? 'https://v1.panda-css.com'

const hasHash = (destination: string) => destination.includes('#')

const v1PathByV2Path = new Map<string, string>()

for (const { source, destination } of [...v1DocsRedirects].sort(
  (a, b) => Number(hasHash(a.destination)) - Number(hasHash(b.destination))
)) {
  if (/[:*]/.test(source)) continue
  const path = destination.split('#')[0]
  if (!v1PathByV2Path.has(path)) v1PathByV2Path.set(path, source)
}

export function getV1Href(pathname: string): string {
  if (!pathname.startsWith('/docs/')) return `${V1_URL}${pathname}`
  return `${V1_URL}${v1PathByV2Path.get(pathname) ?? '/'}`
}
