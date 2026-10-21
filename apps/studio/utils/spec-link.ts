export const MAX_SPEC_BYTES = 10 * 1024 * 1024
export const MAX_PAYLOAD_CHARS = 200_000
export const FETCH_TIMEOUT_MS = 10_000

export type SpecLink = { kind: 'url'; url: URL; theme?: string } | { kind: 'spec'; payload: string; theme?: string }

export type LinkParse = { ok: true; link: SpecLink } | { ok: false; error: string }

export class SpecLinkError extends Error {}

export function parseSpecLink(hash: string): LinkParse | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  const url = params.get('url')
  const spec = params.get('spec')
  const theme = params.get('theme') || undefined

  if (url === null && spec === null) return null
  if (url !== null && spec !== null) {
    return { ok: false, error: 'This link has both url and spec. Use one.' }
  }
  if (spec !== null) return { ok: true, link: { kind: 'spec', payload: spec, theme } }

  const parsed = URL.canParse(url!) ? toSpecUrl(new URL(url!)) : null
  if (!parsed) {
    return {
      ok: false,
      error: "Couldn't load the design system from this link. Use an https URL.",
    }
  }
  return { ok: true, link: { kind: 'url', url: parsed, theme } }
}

export function parseSpecUrlInput(input: string): { ok: true; url: URL } | { ok: false; error: string } {
  const value = input.trim()
  if (!value) return { ok: false, error: 'Enter the URL of a design-system.json.' }
  const href = /^[a-z][\w+.-]*:\/\//i.test(value) ? value : `https://${value}`
  const url = URL.canParse(href) ? toSpecUrl(new URL(href)) : null
  return url ? { ok: true, url } : { ok: false, error: 'Use an https URL.' }
}

export function specLinkHash(link: SpecLink): string {
  const params = new URLSearchParams(link.kind === 'url' ? { url: link.url.href } : { spec: link.payload })
  if (link.theme) params.set('theme', link.theme)
  return `#${params}`
}

export function isAllowedSpecUrl(url: URL): boolean {
  if (url.protocol === 'https:') return true
  return url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
}

const GITHUB_FILE = /^\/([^/]+)\/([^/]+)\/(?:blob|raw)\/(.+)$/

export function toSpecUrl(url: URL): URL | null {
  if (!isAllowedSpecUrl(url)) return null
  const file = url.hostname === 'github.com' ? GITHUB_FILE.exec(url.pathname) : null
  if (!file) return url
  const [, owner, repo, rest] = file
  return new URL(`https://raw.githubusercontent.com/${owner}/${repo}/${rest}`)
}

export function pickTheme(themes: Record<string, unknown>, name?: string): string | undefined {
  return name && Object.hasOwn(themes, name) ? name : undefined
}

export async function readLimited(stream: ReadableStream<Uint8Array>, max = MAX_SPEC_BYTES): Promise<string> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > max) {
      await reader.cancel().catch(() => undefined)
      throw new SpecLinkError('Too large.')
    }
    chunks.push(value)
  }
  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(bytes)
}

export async function fetchSpecText(
  url: URL,
  { fetch = globalThis.fetch, timeoutMs = FETCH_TIMEOUT_MS, max = MAX_SPEC_BYTES } = {},
): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url.href, { credentials: 'omit', signal: controller.signal })
    if (!res.ok) throw new SpecLinkError(`The host answered ${res.status}.`)
    const length = Number(res.headers.get('content-length'))
    if (length > max) throw new SpecLinkError('Too large.')
    if (!res.body) return ''
    return await readLimited(res.body, max)
  } catch (error) {
    if (controller.signal.aborted) throw new SpecLinkError('Timed out.')
    throw error
  } finally {
    clearTimeout(timer)
  }
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  if (!/^[\w-]*$/.test(value) || value.length % 4 === 1) throw new SpecLinkError('Bad encoding.')
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/')
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

export async function decodeSpecPayload(value: string, max = MAX_SPEC_BYTES): Promise<string> {
  if (value.length > MAX_PAYLOAD_CHARS) throw new SpecLinkError('Too large.')
  const colon = value.indexOf(':')
  const format = colon === -1 ? '' : value.slice(0, colon)
  if (format !== 'gz') throw new SpecLinkError('Unknown link format.')

  const bytes = fromBase64Url(value.slice(colon + 1))
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))
  try {
    return await readLimited(stream, max)
  } catch (error) {
    if (error instanceof SpecLinkError) throw error
    throw new SpecLinkError('Corrupt data.')
  }
}

export async function encodeSpecPayload(json: string): Promise<string> {
  const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'))
  return `gz:${toBase64Url(new Uint8Array(await new Response(stream).arrayBuffer()))}`
}

export async function resolveSpecLink(link: SpecLink): Promise<string> {
  const failure =
    link.kind === 'url'
      ? `Couldn't load the design system from ${link.url.host}.`
      : "Couldn't read the design system in this link."
  try {
    return link.kind === 'url' ? await fetchSpecText(link.url) : await decodeSpecPayload(link.payload)
  } catch (error) {
    const reason = error instanceof SpecLinkError ? ` ${error.message}` : ''
    throw new SpecLinkError(failure + reason)
  }
}
