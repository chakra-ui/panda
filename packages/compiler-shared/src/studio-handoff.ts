export async function encodeSpec(json: string): Promise<string> {
  return toBase64Url(await pipe(new TextEncoder().encode(json), new CompressionStream('gzip')))
}

export async function decodeSpec(value: string): Promise<string> {
  return new TextDecoder().decode(await pipe(fromBase64Url(value), new DecompressionStream('gzip')))
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
