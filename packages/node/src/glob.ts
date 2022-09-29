// Credit: https://github.com/tailwindlabs/tailwindcss/blob/4fed060b7c/src/util/parseDependency.js

import globParent from 'glob-parent'
import isGlob from 'is-glob'
import { resolve } from 'path'
import type { Message } from 'postcss'

export function parseGlob(pattern: string) {
  let glob = pattern
  const base = globParent(pattern)

  if (base !== '.') {
    glob = pattern.substring(base.length)
    if (glob.charAt(0) === '/') {
      glob = glob.substring(1)
    }
  }

  if (glob.substring(0, 2) === './') {
    glob = glob.substring(2)
  }
  if (glob.charAt(0) === '/') {
    glob = glob.substring(1)
  }

  return { base, glob }
}

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
