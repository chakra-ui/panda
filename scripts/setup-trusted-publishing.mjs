#!/usr/bin/env node
// Configure npm trusted publishing (OIDC) for every publishable @pandacss/* package.
//
// Why this exists: npm's `npm trust` cannot be driven by a long-lived token, and a
// package must already exist on the registry before you can trust it. This script
// glues those two facts together so onboarding (including new v2 packages) is one command.
//
// Usage:
//   npm login --auth-type=web                 # one-time, gives the session npm trust needs
//   node scripts/setup-trusted-publishing.mjs # configure trust for all existing packages
//
//   # Onboard brand-new packages that aren't on npm yet (uses NPM_TOKEN for the first publish):
//   NPM_TOKEN=xxxx node scripts/setup-trusted-publishing.mjs --first-publish
//
// Flags:
//   --repo <owner/repo>   GitHub repo for the trusted publisher (default: git origin)
//   --file <workflow>     Workflow filename on the repo (default: release.yml)
//   --first-publish       Publish packages missing from npm before trusting them (needs NPM_TOKEN)
//   --dry-run             Print what would happen, change nothing
//   --yes                 Don't pause for confirmation before publishing

import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const REGISTRY = 'https://registry.npmjs.org'

const args = parseArgs(process.argv.slice(2))
const repo = args.repo ?? detectRepo()
const workflowFile = args.file ?? 'release.yml'

if (!repo) fail('Could not determine the GitHub repo. Pass --repo owner/repo.')

const npm = resolveNpm() // a binary new enough for `npm trust` (>= 11.10.0)

console.log(`repo:     ${repo}`)
console.log(`workflow: ${workflowFile}`)
console.log(`npm:      ${[npm.cmd, ...npm.args].join(' ')} (${npm.version})`)
console.log(`mode:     ${args.dryRun ? 'dry-run' : 'live'}\n`)

const me = whoami()
if (!me && !args.dryRun) {
  fail('Not logged in to npm. Run `npm login --auth-type=web` first (trust needs a 2FA session, not a token).')
}
if (me) console.log(`logged in as: ${me}\n`)

const packages = discoverPackages()
if (!packages.length) fail('No publishable @pandacss/* packages found in packages/.')

let built = false
const done = []
const needsManual = []
const failed = []

for (const pkg of packages) {
  const exists = existsOnRegistry(pkg.name)

  if (!exists) {
    if (args.firstPublish) {
      try {
        if (!built) {
          run('pnpm', ['build'], { cwd: ROOT })
          built = true
        }
        confirmPublish(pkg.name)
        firstPublish(pkg)
        waitForRegistry(pkg.name)
      } catch (err) {
        console.error(`  ✗ first publish failed: ${err.message}`)
        failed.push(pkg.name)
        continue
      }
    } else {
      console.log(`  ⤼ ${pkg.name} — not on npm yet, skipping (re-run with --first-publish to onboard)`)
      needsManual.push(pkg.name)
      continue
    }
  }

  if (args.dryRun) {
    console.log(`  • would trust ${pkg.name}`)
    done.push(pkg.name)
    continue
  }

  try {
    trust(pkg.name)
    console.log(`  ✓ ${pkg.name}`)
    done.push(pkg.name)
  } catch (err) {
    console.error(`  ✗ ${pkg.name} — ${err.message.split('\n')[0]}`)
    failed.push(pkg.name)
  }
}

console.log(`\nconfigured: ${done.length}`)
if (needsManual.length) {
  console.log(`needs first publish (re-run with --first-publish): ${needsManual.join(', ')}`)
}
if (failed.length) {
  console.log(`failed: ${failed.join(', ')}`)
  process.exit(1)
}

// --- helpers ---------------------------------------------------------------

function discoverPackages() {
  const pkgsDir = join(ROOT, 'packages')
  const out = []
  for (const entry of readdirSync(pkgsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const manifest = join(pkgsDir, entry.name, 'package.json')
    if (!existsSync(manifest)) continue
    const json = JSON.parse(readFileSync(manifest, 'utf8'))
    if (json.private) continue
    if (!json.name?.startsWith('@pandacss/')) continue
    out.push({ name: json.name, dir: join(pkgsDir, entry.name) })
  }
  return out.sort((a, b) => a.name.localeCompare(b.name))
}

function trust(name) {
  // Relies on the interactive `npm login --auth-type=web` session, not a token.
  run(npm.cmd, [...npm.args, 'trust', 'github', name, '--repo', repo, '--file', workflowFile, '--allow-publish', '-y'], {
    cwd: ROOT,
    stdio: 'inherit', // surface any OTP prompt
  })
}

function firstPublish(pkg) {
  // A package must exist before it can be trusted. Publish with NPM_TOKEN if set
  // (non-interactive), otherwise fall back to the `npm login` session (may prompt for OTP).
  console.log(`  ↑ publishing ${pkg.name} for the first time`)
  const cmd = ['--filter', pkg.name, 'publish', '--no-git-checks', '--access', 'public']

  if (!process.env.NPM_TOKEN) {
    run('pnpm', cmd, { cwd: ROOT })
    return
  }

  const npmrc = join(tmpdir(), `panda-oidc-${pkg.name.replace(/[^a-z0-9]/gi, '-')}.npmrc`)
  writeFileSync(npmrc, `//registry.npmjs.org/:_authToken=${process.env.NPM_TOKEN}\n`)
  try {
    run('pnpm', cmd, { cwd: ROOT, env: { ...process.env, NPM_CONFIG_USERCONFIG: npmrc } })
  } finally {
    rmSync(npmrc, { force: true })
  }
}

function existsOnRegistry(name) {
  try {
    execFileSync('npm', ['view', name, 'version', '--registry', REGISTRY], { stdio: ['ignore', 'pipe', 'ignore'] })
    return true
  } catch {
    return false
  }
}

function waitForRegistry(name, attempts = 20) {
  process.stdout.write(`  … waiting for ${name} to appear on npm`)
  for (let i = 0; i < attempts; i++) {
    if (existsOnRegistry(name)) {
      process.stdout.write(' ok\n')
      return
    }
    process.stdout.write('.')
    sleep(3000)
  }
  process.stdout.write('\n')
  throw new Error(`${name} did not show up on the registry in time`)
}

function whoami() {
  try {
    return execFileSync('npm', ['whoami', '--registry', REGISTRY], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return null
  }
}

function resolveNpm() {
  try {
    const v = execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim()
    if (gte(v, '11.10.0')) return { cmd: 'npm', args: [], version: v }
    console.log(`local npm ${v} is too old for \`npm trust\`, falling back to \`npx npm@latest\``)
  } catch {}
  return { cmd: 'npx', args: ['-y', 'npm@latest'], version: 'latest via npx' }
}

function confirmPublish(name) {
  if (args.yes || args.dryRun) return
  // Publishing is irreversible (npm only allows unpublish within 72h). Give a beat to bail.
  console.log(`  ! about to publish ${name} to npm. Ctrl-C within 5s to abort.`)
  sleep(5000)
}

function detectRepo() {
  try {
    const url = execFileSync('git', ['remote', 'get-url', 'origin'], { cwd: ROOT, encoding: 'utf8' }).trim()
    const m = url.match(/github\.com[/:]([^/]+\/[^/]+?)(?:\.git)?$/)
    return m ? m[1] : null
  } catch {
    return null
  }
}

function parseArgs(argv) {
  const out = { dryRun: false, firstPublish: false, yes: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--dry-run') out.dryRun = true
    else if (a === '--first-publish') out.firstPublish = true
    else if (a === '--yes' || a === '-y') out.yes = true
    else if (a === '--repo') out.repo = argv[++i]
    else if (a === '--file') out.file = argv[++i]
    else fail(`Unknown argument: ${a}`)
  }
  return out
}

function run(cmd, cmdArgs, opts = {}) {
  return execFileSync(cmd, cmdArgs, { stdio: 'inherit', ...opts })
}

function gte(a, b) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) > (pb[i] ?? 0)) return true
    if ((pa[i] ?? 0) < (pb[i] ?? 0)) return false
  }
  return true
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

function fail(msg) {
  console.error(`error: ${msg}`)
  process.exit(1)
}
