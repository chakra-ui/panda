import { readFileSync } from 'node:fs'

const compilerPackage = JSON.parse(readFileSync('packages/compiler/package.json', 'utf8'))

if (!compilerPackage.optionalDependencies?.['@pandacss/compiler-wasm32-wasi']) {
  throw new Error(
    'Missing @pandacss/compiler-wasm32-wasi optionalDependency. Run `pnpm release:prepare` before `pnpm release:verify`.',
  )
}
