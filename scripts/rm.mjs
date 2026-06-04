// rimraf replacement: node scripts/rm.mjs "**/dist" "**/.turbo" "**/*.log"
// Hand-rolled walk because fs.globSync's `**` skips dot-dirs (.turbo/.next) and is Node 22+.
import { readdirSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'

const PRUNE = new Set(['node_modules', '.git'])
// retries cover Windows EPERM/EBUSY on locked files (what rimraf handled)
const RM = { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }

const toMatcher = (name) => {
  if (!name.includes('*')) return (entry) => entry === name
  const re = new RegExp('^' + name.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$')
  return (entry) => re.test(entry)
}

const walkRemove = (dir, match, removeNodeModules) => {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (match(entry.name)) {
      rmSync(full, RM)
      continue
    }
    if (entry.isDirectory()) {
      if (PRUNE.has(entry.name) && !(removeNodeModules && entry.name === 'node_modules')) continue
      walkRemove(full, match, removeNodeModules)
    }
  }
}

const cwd = process.cwd()
for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('**/')) {
    const name = arg.slice(3)
    walkRemove(cwd, toMatcher(name), name === 'node_modules')
  } else {
    rmSync(resolve(cwd, arg), RM)
  }
}
