import { statSync } from 'node:fs'

export function readFileStamp(path: string): string {
  try {
    const stat = statSync(path)
    return `${stat.mtimeMs}:${stat.size}`
  } catch {
    return 'missing'
  }
}
