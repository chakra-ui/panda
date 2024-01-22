import isGlob from 'is-glob'
import { normalize, resolve } from 'path'
import type { Message } from 'postcss'
import { parseGlob } from './parse-glob'

export function parseDependency(fileOrGlob: string) {
  if (fileOrGlob.startsWith('!')) {
    return null
  }

  let message: Message | null = null

  if (isGlob(fileOrGlob)) {
    const { base, glob } = parseGlob(fileOrGlob)
    message = { type: 'dir-dependency', dir: normalize(resolve(base)), glob }
  } else {
    message = { type: 'dependency', file: normalize(resolve(fileOrGlob)) }
  }

  if (message.type === 'dir-dependency' && process.env.ROLLUP_WATCH === 'true') {
    message = { type: 'dependency', file: normalize(resolve(message.dir)) }
  }

  return message
}
