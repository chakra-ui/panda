import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Asserts @sandbox/overlay emitted a *virtualized* styled-system: DS-owned recipes/patterns
// are re-exported from @sandbox/ds, not re-emitted locally. Guards against a stale compiler.node
// silently falling back to a full local tree — a Vite build passes either way, so only this check
// catches it.

const ss = join(dirname(fileURLToPath(import.meta.url)), '..', 'packages', 'overlay', 'styled-system')
const read = (p) => readFileSync(join(ss, p), 'utf8')

try {
  const recipes = read('recipes/index.js')
  assert.match(
    recipes,
    /export \{ chip \} from '@sandbox\/ds\/recipes'/,
    'DS recipe `chip` must be re-exported from @sandbox/ds, not re-emitted',
  )
  assert.match(recipes, /export \* from '\.\/panel'/, 'app recipe `panel` must emit locally')
  assert.match(recipes, /export \* from '\.\/tag'/, 'app-overridden recipe `tag` must emit locally (app wins)')
  assert.ok(!existsSync(join(ss, 'recipes/chip.js')), 'recipes/chip.js must NOT be emitted — the DS owns it')

  const patterns = read('patterns/index.js')
  assert.match(patterns, /from '@sandbox\/ds\/patterns'/, 'DS patterns must be re-exported from @sandbox/ds')
  assert.ok(!existsSync(join(ss, 'patterns/stack.js')), 'patterns/stack.js must NOT be emitted — the DS owns it')

  for (const runtime of ['helpers.js', 'css/cx.js', 'css/conditions.js', 'css/css.js', 'css/cva.js', 'css/sva.js']) {
    assert.ok(!existsSync(join(ss, runtime)), `${runtime} must NOT be emitted — the runtime is virtualized from @sandbox/ds`)
  }

  assert.match(
    read('css/index.js'),
    /export \* from '@sandbox\/ds\/css'/,
    'css/index.js must be a re-export barrel of @sandbox/ds/css',
  )
  assert.match(
    read('recipes/runtime.js'),
    /from '@sandbox\/ds\/helpers'/,
    "the app's recipe runtime must import helpers from @sandbox/ds, not a local ../helpers",
  )
} catch (error) {
  console.error(`✗ overlay is NOT virtualized — it re-emitted DS artifacts locally.\n  ${error.message}`)
  console.error('  A full local tree usually means a stale compiler.node. Rebuild it:')
  console.error('  pnpm --filter @pandacss/compiler build:native')
  process.exit(1)
}

console.log('✓ overlay styled-system is virtualized (DS recipes/patterns + runtime re-exported, not re-emitted)')
