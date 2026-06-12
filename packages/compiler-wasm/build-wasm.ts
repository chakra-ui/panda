import { execSync } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = dirname(fileURLToPath(import.meta.url))
const cratePath = resolve(packageRoot, 'crate')

function run(cmd: string, args: string[]) {
  console.log(`$ ${cmd} ${args.join(' ')}`)
  execSync([cmd, ...args].join(' '), { stdio: 'inherit', cwd: packageRoot })
}

function ensureWasmPack() {
  try {
    execSync('wasm-pack --version', { stdio: 'pipe' })
  } catch {
    console.error(
      [
        'wasm-pack is not on PATH.',
        '',
        'Install it with one of:',
        '  cargo install wasm-pack --locked',
        '  npm install -g wasm-pack',
        '  brew install wasm-pack',
      ].join('\n'),
    )
    process.exit(1)
  }
}

function build(target: 'web' | 'nodejs', outDir: string) {
  run('wasm-pack', [
    'build',
    cratePath,
    '--target',
    target,
    '--out-dir',
    resolve(packageRoot, outDir),
    '--out-name',
    'compiler_wasm',
    '--release',
    // Strip the generated package.json so consumers see ours instead.
    '--no-pack',
  ])
}

function writePackageType(outDir: string, type: 'commonjs' | 'module') {
  writeFileSync(resolve(packageRoot, outDir, 'package.json'), `${JSON.stringify({ type }, null, 2)}\n`)
}

function main() {
  ensureWasmPack()

  if (!existsSync(cratePath)) {
    console.error(`crate directory missing: ${cratePath}`)
    process.exit(1)
  }

  // Two targets: nodejs (CommonJS, for vitest + SSR) and web (ESM + fetch, for browser).
  // wasm-pack runs `cargo build` then `wasm-bindgen` + `wasm-opt` per target.
  build('nodejs', 'pkg-node')
  writePackageType('pkg-node', 'commonjs')
  build('web', 'pkg-web')
  writePackageType('pkg-web', 'module')

  console.log('\nwasm artifacts:')
  console.log(`  ${resolve(packageRoot, 'pkg-node')}`)
  console.log(`  ${resolve(packageRoot, 'pkg-web')}`)
}

main()
