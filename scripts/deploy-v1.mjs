// Deploy the v1 Vercel projects from the repo root (they are not connected to Git).
// node scripts/deploy-v1.mjs [docs] [studio] [playground] [--preview]
import { execSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const SCOPE = 'chakra-ui'
const PROJECTS = {
  docs: 'panda-docs',
  studio: 'panda-studio',
  playground: 'panda-playground',
}

const args = process.argv.slice(2)
const preview = args.includes('--preview')
const targets = args.filter((arg) => !arg.startsWith('--'))
const selected = targets.length ? targets : Object.keys(PROJECTS)

const unknown = selected.filter((name) => !PROJECTS[name])
if (unknown.length) {
  console.error(`Unknown target: ${unknown.join(', ')}. Use one of: ${Object.keys(PROJECTS).join(', ')}`)
  process.exit(1)
}

const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim()
if (branch !== 'v1') {
  console.error(`v1 deploys must run from the v1 branch (current: ${branch})`)
  process.exit(1)
}

// Vercel applies each project's root directory setting, so deploy from the monorepo root
const root = fileURLToPath(new URL('..', import.meta.url))

for (const name of selected) {
  console.log(`\nDeploying ${name}${preview ? ' (preview)' : ''}...`)
  const flags = ['--yes', '--scope', SCOPE, '--project', PROJECTS[name], ...(preview ? [] : ['--prod'])]
  const result = spawnSync('vercel', ['deploy', ...flags], { cwd: root, stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}
