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

const v1InstallGuides = new Set([
  'angular',
  'astro',
  'cli',
  'ember',
  'gatsby',
  'nextjs',
  'nuxt',
  'postcss',
  'preact',
  'qwik',
  'react-router',
  'redwood',
  'remix',
  'rsbuild',
  'solidjs',
  'storybook',
  'svelte',
  'vite',
  'vue'
])

export function getV1Href(pathname: string): string {
  if (!pathname.startsWith('/docs/')) return `${V1_URL}${pathname}`
  const mapped = v1PathByV2Path.get(pathname)
  if (mapped) return `${V1_URL}${mapped}`
  const guide = pathname.match(/^\/docs\/get-started\/([^/]+)$/)?.[1]
  if (guide && v1InstallGuides.has(guide))
    return `${V1_URL}/docs/installation/${guide}`
  return `${V1_URL}/`
}
