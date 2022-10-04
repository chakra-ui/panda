import { logger } from '@css-panda/logger'
import { emitArtifacts, generate, loadConfigAndCreateContext, setupConfig, setupPostcss } from '@css-panda/node'
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
    .option('--silent', "Don't print any logs")
    .action(async (flags) => {
      const { force, postcss, silent } = flags

      if (silent) logger.level = 'silent'

      logger.info(`Panda v${pkgJson.version}\n`)

      const done = logger.time.info('✨ Panda initialized')

      if (postcss) await setupPostcss(cwd)
      await setupConfig(cwd, { force })

      const ctx = await loadConfigAndCreateContext()
      const msg = await emitArtifacts(ctx)

      logger.log(msg)

      done()
    })

  cli
    .command('gen', 'Generate the panda system')
    .option('--silent', "Don't print any logs")
    .action(async (flags) => {
      const { silent } = flags

      if (silent) logger.level = 'silent'

      const ctx = await loadConfigAndCreateContext()
      const msg = await emitArtifacts(ctx)

      logger.log(msg)
    })

  cli
    .command('[files]', 'Include file glob', {
      ignoreOptionDefaultValue: true,
    })
    .option('-o, --outdir <dir>', 'Output directory', { default: 'panda' })
    .option('-m, --minify', 'Minify generated code')
    .option('--cwd <cwd>', 'Current working directory', { default: process.cwd() })
    .option('-w, --watch', 'Watch files and rebuild')
    .option('-c, --config <path>', 'Path to panda config file')
    .option('--preflight', 'Enable css reset')
    .option('--silent', "Don't print any logs")
    .option('-e, --exclude <files>', 'Exclude files', { default: [] })
    .option('--clean', 'Clean output directory')
    .option('--hash', 'Hash the generated classnames to make them shorter')
    .action(async (files: string[], flags) => {
      const { config: configPath, silent, ...rest } = flags
      if (silent) logger.level = 'silent'

      const options = compact({ include: files, ...rest })
      logger.debug({ type: 'cli', msg: options })
      await generate(options, configPath)
    })

  cli.help()

  cli.version(pkgJson.version)

  cli.parse(process.argv, { run: false })
  await cli.runMatchedCommand()
}
