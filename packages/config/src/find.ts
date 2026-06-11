import { readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { PandaError } from './error'

const configFiles = new Set([
  'panda.config.ts',
  'panda.config.js',
  'panda.config.mts',
  'panda.config.mjs',
  'panda.config.cts',
  'panda.config.cjs',
])

const isPandaConfig = (file: string) => configFiles.has(file)

/** Walk up from `cwd` to the filesystem root, returning the first directory that
 *  holds a `panda.config.*` file. */
function findUp(cwd: string): string | undefined {
  let dir = resolve(cwd)

  while (true) {
    let entries: string[]
    try {
      entries = readdirSync(dir)
    } catch {
      entries = []
    }

    const match = entries.find(isPandaConfig)
    if (match) return resolve(dir, match)

    const parent = dirname(dir)
    if (parent === dir) return undefined
    dir = parent
  }
}

/** Locate the user's `panda.config.{ts,js,…}`, walking up from `cwd`. */
export function findConfig(options: { cwd: string; file?: string }): string {
  const { cwd, file } = options

  if (file) {
    return resolve(cwd, file)
  }

  const configPath = findUp(cwd)

  if (!configPath) {
    throw new PandaError(
      'CONFIG_NOT_FOUND',
      'Cannot find config file `panda.config.{ts,js,mjs,mts}`. Did you forget to run `panda init`?',
    )
  }

  return configPath
}
