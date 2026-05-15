import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

async function main() {
  const { NapiCli } = require('@napi-rs/cli') as {
    NapiCli: new () => {
      build(options: Record<string, unknown>): Promise<void>
    }
  }

  const cli = new NapiCli()

  await cli.build({
    cwd: new URL('./crate', import.meta.url).pathname,
    platform: true,
    release: true,
    dts: false,
  })
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
