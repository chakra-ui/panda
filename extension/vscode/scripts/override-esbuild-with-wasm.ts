import type { PackageManifest } from '@pnpm/types'
import fs from 'fs'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

const _dirname = dirname(fileURLToPath(import.meta.url))

const main = async () => {
  const pkgJsonPath = path.join(_dirname, '../package.json')
  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8')) as PackageManifest

  // Github runners dont support arm64 on macos
  // https://github.com/actions/runner-images/issues/2187

  // unless self-hosted but
  // https://github.com/medic/cht-core/issues/8277#issuecomment-1568021046
  // > GitHub recommends only utilizing self-hosted runners with private repositories.
  // > Allowing self-hosted runners on public repositories and allowing workflows on public forks
  // > introduces a significant security risk.

  // so we need to use esbuild-wasm instead of esbuild
  // if we want to be able to publish the extension for M1 macs from the CI
  // (or we could also just publish the extension from our own M1 machines)

  // @ts-expect-error
  pkgJson.overrides = {
    esbuild: 'npm:esbuild-wasm@latest',
  }

  fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2))
}
main()
