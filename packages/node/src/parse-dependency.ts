import isGlob from 'is-glob'
import { resolve } from 'pathe'
import type { Message } from 'postcss'
import { parseGlob } from './parse-glob'

export function parseDependency(fileOrGlob: string) {
  if (fileOrGlob.startsWith('!')) {
    return null
  }

  let message: Message | null = null

  if (isGlob(fileOrGlob)) {
    const { base, glob } = parseGlob(fileOrGlob)
    message = { type: 'dir-dependency', dir: resolve(base), glob }
  } else {
    message = { type: 'dependency', file: resolve(fileOrGlob) }
  }

  if (message.type === 'dir-dependency' && process.env.ROLLUP_WATCH === 'true') {
    message = { type: 'dependency', file: message.dir }
  }

  return message
}
