import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const cache = mkdtempSync(join(tmpdir(), 'panda-compiler-wasm-pack-'))

try {
  const result = spawnSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
    cwd: import.meta.dirname,
    encoding: 'utf8',
    env: { ...process.env, npm_config_cache: cache },
  })

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'npm pack --dry-run failed')
  }

  const [pack] = JSON.parse(result.stdout)
  const files = new Set(pack.files.map((file) => file.path))
  const expected = [
    'pkg-node/compiler_wasm.js',
    'pkg-node/compiler_wasm_bg.wasm',
    'pkg-web/compiler_wasm.js',
    'pkg-web/compiler_wasm_bg.wasm',
  ]
  const missing = expected.filter((file) => !files.has(file))
  const stale = [...files].filter((file) => /(^|\/)binding_wasm/.test(file))

  if (missing.length || stale.length) {
    const details = [...missing.map((file) => `missing: ${file}`), ...stale.map((file) => `stale: ${file}`)]
    throw new Error(`invalid @pandacss/compiler-wasm package:\n${details.join('\n')}`)
  }
} finally {
  rmSync(cache, { recursive: true, force: true })
}
