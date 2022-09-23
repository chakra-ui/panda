import { createRequire } from 'module'
import { dirname, join } from 'path'

const req = typeof globalThis.require === 'function' ? globalThis.require : createRequire(import.meta.url)

export function getEntrypoint(pkg: string, file: { dev: string; prod?: string }) {
  const { dev, prod = dev } = file
  const entry = req.resolve(pkg)

  const isDist = entry.includes('dist')
  const isType = pkg.includes('/types')

  if (isType) {
    return join(dirname(entry), dev)
  }

  if (!isDist) {
    return join(dirname(entry), 'src', dev)
  }

  return join(dirname(entry), prod)
}
