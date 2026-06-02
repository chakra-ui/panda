// Tiny rimraf replacement. Removes every path matching the given glob patterns,
// resolved from the current working directory. Used by the root clean/reset
// scripts (run from the repo root) and the next-js sandbox dev scripts.
//
//   node scripts/rm.mjs "**/dist" "**/.turbo" "**/*.log"
//
// .git is always skipped. node_modules is pruned so a pattern like "**/dist"
// never descends into dependencies. When a pattern explicitly targets
// node_modules (reset), the node_modules dirs themselves are kept so they can
// be removed.
import { globSync, rmSync } from 'node:fs'

const patterns = process.argv.slice(2)
const targetingNodeModules = patterns.some((pattern) => pattern.includes('node_modules'))

const exclude = (path) => {
  const segments = path.split(/[\\/]/)
  if (segments.includes('.git')) return true
  const nm = segments.indexOf('node_modules')
  if (nm === -1) return false
  return targetingNodeModules ? nm < segments.length - 1 : true
}

for (const match of globSync(patterns, { exclude })) {
  rmSync(match, { recursive: true, force: true })
}
