import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const compilerDir = 'packages/compiler'
const compilerPackage = JSON.parse(readFileSync(join(compilerDir, 'package.json'), 'utf8'))
const optionalDependencies = compilerPackage.optionalDependencies ?? {}
const wasiPackage = '@pandacss/compiler-wasm32-wasi'

// napi-rs 3.9+ leaves the wasi package out of optionalDependencies unless
// `napi.wasm.optionalDependency` is set: its manifest no longer carries a `cpu`
// gate, so listing it would make every consumer download the wasm. The
// WebContainer loader installs it on demand instead (see load-binary.ts).
const expectWasi = compilerPackage.napi?.wasm?.optionalDependency === true

const nativePackages = readdirSync(join(compilerDir, 'npm'))
  .filter((dir) => dir !== 'wasm32-wasi')
  .map((dir) => JSON.parse(readFileSync(join(compilerDir, 'npm', dir, 'package.json'), 'utf8')).name)

const problems = []

for (const name of nativePackages) {
  const found = optionalDependencies[name]
  if (found !== compilerPackage.version) {
    problems.push(`${name}: expected ${compilerPackage.version}, found ${found ?? 'nothing'}`)
  }
}

const wasiFound = optionalDependencies[wasiPackage]
if (expectWasi && wasiFound !== compilerPackage.version) {
  problems.push(`${wasiPackage}: expected ${compilerPackage.version}, found ${wasiFound ?? 'nothing'}`)
}
if (!expectWasi && wasiFound) {
  problems.push(`${wasiPackage}: must not be an optionalDependency unless napi.wasm.optionalDependency is set`)
}

if (problems.length > 0) {
  throw new Error(
    `Release artifacts are not ready. Run \`pnpm release:prepare\` before \`pnpm release:verify\`.\n- ${problems.join('\n- ')}`,
  )
}
