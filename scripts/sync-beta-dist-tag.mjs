import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'

const apply = process.argv.includes('--apply')

const preState = readJson('.changeset/pre.json')
if (preState?.mode !== 'pre') {
  throw new Error('Not in changesets pre mode. This script only syncs the prerelease dist-tag.')
}
const tag = preState.tag

const targets = readdirSync('packages', { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => readJson(`packages/${entry.name}/package.json`))
  .filter((pkg) => pkg && !pkg.private && pkg.name && pkg.version.includes('-'))
  .sort((a, b) => a.name.localeCompare(b.name))

if (!targets.length) throw new Error('No publishable prerelease packages found under packages/.')

const plan = targets.map((pkg) => {
  const published = distTags(pkg.name)
  if (!published) return { pkg, state: 'unpublished' }
  if (!published.versions.includes(pkg.version)) return { pkg, state: 'not-on-registry' }
  const current = published.tags[tag]
  return { pkg, current, state: current === pkg.version ? 'ok' : 'stale' }
})

for (const { pkg, current, state } of plan) {
  const label = pkg.name.padEnd(30)
  if (state === 'ok') console.log(`  ok        ${label} ${tag} -> ${pkg.version}`)
  else if (state === 'stale') console.log(`  stale     ${label} ${tag} -> ${current ?? '(unset)'}, want ${pkg.version}`)
  else if (state === 'unpublished') console.log(`  skip      ${label} not on the registry`)
  else console.log(`  skip      ${label} ${pkg.version} not published yet`)
}

const stale = plan.filter((entry) => entry.state === 'stale')

if (!stale.length) {
  console.log(`\nEvery published package already points ${tag} at its current version.`)
  process.exit(0)
}

if (!apply) {
  console.log(`\n${stale.length} package(s) would be retagged. Re-run with --apply to move them.`)
  process.exit(1)
}

console.log('')
const failed = []
for (const { pkg } of stale) {
  try {
    execFileSync('npm', ['dist-tag', 'add', `${pkg.name}@${pkg.version}`, tag], { stdio: 'inherit' })
  } catch {
    failed.push(pkg.name)
  }
}

// Re-read rather than trusting the exit codes; a dist-tag write can report success and not stick.
const unresolved = stale.filter(({ pkg }) => distTags(pkg.name)?.tags[tag] !== pkg.version)
if (unresolved.length || failed.length) {
  const names = [...new Set([...failed, ...unresolved.map(({ pkg }) => pkg.name)])]
  throw new Error(`Failed to move ${tag} for: ${names.join(', ')}`)
}

console.log(`\nMoved ${tag} for ${stale.length} package(s).`)

function distTags(name) {
  try {
    const raw = execFileSync('npm', ['view', name, 'dist-tags', 'versions', '--json'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    const view = JSON.parse(raw)
    return { tags: view['dist-tags'] ?? {}, versions: [view.versions ?? []].flat() }
  } catch {
    return null
  }
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}
