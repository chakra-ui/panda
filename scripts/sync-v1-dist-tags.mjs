import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'

const apply = process.argv.includes('--apply')
const TAG = 'v1'

const targets = readdirSync('packages', { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => readJson(`packages/${entry.name}/package.json`))
  .filter((pkg) => pkg && !pkg.private && pkg.name && !pkg.version.includes('-'))
  .sort((a, b) => a.name.localeCompare(b.name))

if (!targets.length) throw new Error('No publishable packages found under packages/.')

const moves = []
const leaked = []

for (const pkg of targets) {
  const label = pkg.name.padEnd(34)
  const published = distTags(pkg.name)
  if (!published) {
    console.log(`  skip      ${label} not on the registry`)
    continue
  }
  if (!published.versions.includes(pkg.version)) {
    console.log(`  skip      ${label} ${pkg.version} not published yet`)
    continue
  }

  const v2Versions = published.versions.filter((version) => major(version) >= 2)
  const tags = v2Versions.length ? [TAG] : [TAG, 'latest']
  const v2IsStable = v2Versions.some((version) => !version.includes('-'))

  if (v2IsStable && major(published.tags.latest ?? '0') < 2) leaked.push(pkg.name)

  for (const tag of tags) {
    const current = published.tags[tag]
    if (current === pkg.version) {
      console.log(`  ok        ${label} ${tag} -> ${pkg.version}`)
    } else {
      console.log(`  stale     ${label} ${tag} -> ${current ?? '(unset)'}, want ${pkg.version}`)
      moves.push({ pkg, tag })
    }
  }
}

if (leaked.length) {
  console.error(`\nlatest points at a v1 version for packages that ship a stable v2: ${leaked.join(', ')}`)
  console.error('Move it back with `npm dist-tag add <pkg>@<v2-version> latest`.')
  process.exit(1)
}

if (!moves.length) {
  console.log(`\nEvery published package already has its v1 dist-tags in place.`)
  process.exit(0)
}

if (!apply) {
  console.log(`\n${moves.length} dist-tag(s) would move. Re-run with --apply to move them.`)
  process.exit(1)
}

console.log('')
const failed = []
for (const { pkg, tag } of moves) {
  try {
    execFileSync('npm', ['dist-tag', 'add', `${pkg.name}@${pkg.version}`, tag], { stdio: 'inherit' })
  } catch {
    failed.push(`${pkg.name}@${tag}`)
  }
}

let unresolved = moves
for (let attempt = 0; attempt < 12 && unresolved.length; attempt++) {
  if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 5000))
  unresolved = unresolved.filter(({ pkg, tag }) => distTags(pkg.name, { fresh: true })?.tags[tag] !== pkg.version)
}
if (unresolved.length || failed.length) {
  const names = [...new Set([...failed, ...unresolved.map(({ pkg, tag }) => `${pkg.name}@${tag}`)])]
  throw new Error(`Failed to move dist-tags for: ${names.join(', ')}`)
}

console.log(`\nMoved ${moves.length} dist-tag(s).`)

function major(version) {
  return Number(version.split('.')[0])
}

function distTags(name, { fresh = false } = {}) {
  try {
    const args = ['view', name, 'dist-tags', 'versions', '--json']
    if (fresh) args.push('--prefer-online')
    const raw = execFileSync('npm', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
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
