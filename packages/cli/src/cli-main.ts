import { logger } from '@css-panda/logger'
import {
  emitArtifacts,
  execCommand,
  generate,
  loadConfigAndCreateContext,
  setupConfig,
  setupPostcss,
} from '@css-panda/node'
import { compact } from '@css-panda/shared'
import { cac } from 'cac'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function main() {
  const cli = cac('panda')

  const cwd = process.cwd()
  const pkgPath = join(__dirname, '../package.json')
  const pkgJson = JSON.parse(readFileSync(pkgPath, 'utf8'))

  cli
    .command('init', "Initialize the panda's config file")
    .option('-f, --force', 'Force overwrite existing config file')
    .option('-p, --postcss', 'Emit postcss config file')
    .action(async (flags) => {
      logger.info(`Panda v${pkgJson.version}\n`)
      const done = logger.time.info('✨ Panda initialized')

      if (flags.postcss) {
        await setupPostcss(cwd)
      }
      await setupConfig(cwd, { force: flags.force })
      await execCommand('panda gen', cwd)

      done()
    })

  cli.command('gen', 'Generate the panda system').action(async () => {
    const ctx = await loadConfigAndCreateContext()
    const msg = await emitArtifacts(ctx)
    if (msg) {
      logger.log(msg)
    }
  })

  cli
    .command('[files]', 'Include files', {
      ignoreOptionDefaultValue: true,
    })
    .option('-o, --outdir <dir>', 'Output directory', { default: '.panda' })
    .option('-m, --minify', 'Minify generated code')
    .option('--cwd <cwd>', 'Current working directory', { default: process.cwd() })
    .option('-w, --watch', 'Watch files and rebuild')
    .option('--exclude <exclude>', 'Define compile-time env variables')
    .option('--clean', 'Clean output directory')
    .option('--hash', 'Hash the generated classnames to make them shorter')
    .action(async (files: string[], flags) => {
      const options = compact({ include: files, ...flags })
      logger.debug({ type: 'cli', msg: options })
      await generate(options)
    })

  cli.help()

  cli.version(pkgJson.version)

  cli.parse(process.argv, { run: false })
  await cli.runMatchedCommand()
}
