import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const require = createRequire(import.meta.url)
const packageRoot = dirname(fileURLToPath(import.meta.url))

async function main() {
  const { NapiCli } = require('@napi-rs/cli') as {
    NapiCli: new () => {
      build(options: Record<string, unknown>): Promise<void>
    }
  }

  const cli = new NapiCli()

  await cli.build({
    cwd: packageRoot,
    manifestPath: 'crate/Cargo.toml',
    outputDir: packageRoot,
    release: true,
    dts: 'native.d.ts',
  })
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
