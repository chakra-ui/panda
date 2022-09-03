import { cac } from 'cac'
import path from 'path'
import fs from 'fs'

export async function main(options = {}) {
  const cli = cac('panda')

  cli
    .command('[...files]', 'Include files', {
      ignoreOptionDefaultValue: true,
    })
    .option('-o, --out-dir <dir>', 'Output directory', { default: '.panda' })
    .option('--minify', 'Minify generated code')
    .option('--cwd <cwd>', 'Current working directory')
    .option('--watch', 'Watch files and rebuild')
    .option('--exclude <exclude>', 'Define compile-time env variables')
    .option('--clean', 'Clean output directory')
    .option('--silent', 'Suppress non-error logs (excluding "onSuccess" process output)')
    .action(async (files: string[], flags) => {
      console.log({ options, files, flags })
    })

  cli.help()

  const pkgPath = path.join(__dirname, '../package.json')
  cli.version(JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version)

  cli.parse(process.argv, { run: false })
  await cli.runMatchedCommand()
}
