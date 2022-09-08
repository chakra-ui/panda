import { cac } from 'cac'
import path from 'path'
import fs from 'fs'
import { generate } from '@css-panda/node'
import { logger } from '@css-panda/logger'

export async function main() {
  const cli = cac('panda')

  const options: Record<string, any> = {}

  cli
    .command('[files]', 'Include files', {
      ignoreOptionDefaultValue: true,
    })
    .option('-o, --out-dir <dir>', 'Output directory', { default: '.panda' })
    .option('--minify', 'Minify generated code')
    .option('--cwd <cwd>', 'Current working directory', { default: process.cwd() })
    .option('--watch', 'Watch files and rebuild')
    .option('--exclude <exclude>', 'Define compile-time env variables')
    .option('--clean', 'Clean output directory')
    .option('--silent', 'Suppress non-error logs (excluding "onSuccess" process output)')
    .action(async (files: string[], flags) => {
      if (files) {
        options.include = files
      }
      if (flags.cwd) {
        options.cwd = flags.cwd
      }
      if (flags.outDir) {
        options.outdir = flags.outDir
      }
      if (flags.minify) {
        options.minify = true
      }
      if (flags.watch) {
        options.watch = true
      }
      logger.debug({ type: 'cli', msg: options })
      await generate(options)
    })

  cli.help()

  const pkgPath = path.join(__dirname, '../package.json')
  cli.version(JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version)

  cli.parse(process.argv, { run: false })
  await cli.runMatchedCommand()
}
