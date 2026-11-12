export function toPosixPath(path: string): string {
  return path.includes('\\') ? path.split('\\').join('/') : path
}

export function isPathInside(file: string, dir: string): boolean {
  const root = normalize(dir).replace(/\/+$/, '')
  const path = normalize(file.split('?')[0] ?? file)
  return path === root || path.startsWith(`${root}/`)
}

function normalize(path: string): string {
  const posix = toPosixPath(path)
  return /^[a-z]:\//i.test(posix) ? posix.toLowerCase() : posix
}
