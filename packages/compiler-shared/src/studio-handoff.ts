export interface SealedSpec {
  iv: string
  data: string
}

export async function sealSpec(json: string): Promise<{ sealed: SealedSpec; key: string }> {
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt'])
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const zipped = await pipe(new TextEncoder().encode(json), new CompressionStream('gzip'))
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, zipped))
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', key))
  return { sealed: { iv: toBase64Url(iv), data: toBase64Url(data) }, key: toBase64Url(raw) }
}

export async function openSpec(sealed: SealedSpec, key: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey('raw', fromBase64Url(key), 'AES-GCM', false, ['decrypt'])
  const zipped = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64Url(sealed.iv) },
    cryptoKey,
    fromBase64Url(sealed.data),
  )
  return new TextDecoder().decode(await pipe(new Uint8Array(zipped), new DecompressionStream('gzip')))
}

async function pipe(
  bytes: Uint8Array<ArrayBuffer>,
  transform: CompressionStream | DecompressionStream,
): Promise<Uint8Array<ArrayBuffer>> {
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(transform)).arrayBuffer())
}

function toBase64Url(bytes: Uint8Array<ArrayBuffer>): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), (char) => char.charCodeAt(0))
}
