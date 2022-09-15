import { logger } from '@css-panda/logger'
import { execCommand, generate, loadConfig, setupConfig, setupSystem } from '@css-panda/node'
import { compact } from '@css-panda/shared'
import { cac } from 'cac'
import fs from 'fs'
import path from 'path'

export async function main() {
  const cli = cac('panda')

  const cwd = process.cwd()
  const pkgPath = path.join(__dirname, '../package.json')
  const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))

  cli.command('init', "Initialize the panda's config file").action(async () => {
    logger.info(`Panda v${pkgJson.version}`)
    await setupConfig(cwd)
    await execCommand('panda gen', cwd)
  })

  cli.command('gen', 'Generate the panda system').action(async () => {
    const config = await loadConfig(cwd)
    const { message: msg } = await setupSystem(config)
    logger.info(msg)
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
    .option('--silent', 'Suppress non-error logs (excluding "onSuccess" process output)')
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
