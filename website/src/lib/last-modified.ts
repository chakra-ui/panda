import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const run = promisify(execFile)
const cache = new Map<string, Promise<Date | null>>()

async function read(filePath: string): Promise<Date | null> {
  try {
    const { stdout } = await run(
      'git',
      ['log', '-1', '--format=%aI', '--', filePath],
      { cwd: process.cwd() }
    )
    const date = new Date(stdout.trim())
    return isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}

export function lastModified(filePath: string): Promise<Date | null> {
  let entry = cache.get(filePath)
  if (!entry) {
    entry = read(filePath)
    cache.set(filePath, entry)
  }
  return entry
}
