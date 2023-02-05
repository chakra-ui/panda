import globParent from 'glob-parent'

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
