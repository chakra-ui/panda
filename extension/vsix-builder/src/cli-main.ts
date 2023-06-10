import { cac } from 'cac'
import fs from 'fs'
import path from 'path'
import { createVsix } from './create-vsix'
import { Targets } from './vsce/package'

/**
 * @see https://github.com/microsoft/vscode-vsce/blob/8c1b1a095f4214666c5efdd57f5ca70d3e6a9fd7/src/main.ts#L60
 */
export async function main() {
  const cwd = process.cwd()

  const cli = cac('vsix-builder')
  const pkgJson = require('../package.json')

  const ValidTargets = [...Targets].join(', ')

  cli
    .command('package [version]')
    .option('--pre-release', 'Mark this package as a pre-release')
    .option('-o, --out <path>', 'Output .vsix extension file to <path> location (defaults to panda.vsix)')
    .option('-t, --target <target>', `Target architecture. Valid targets: ${ValidTargets}`)
    .option('--dry', 'List the files that would have been included in the package')
    .action(async (version, flags) => {
      console.log(`Creating a VSIX for ${pkgJson.name}...`)
      const outfile = flags?.out ?? path.join(cwd, 'panda.vsix')

      const start = performance.now()
      const vsix = await createVsix({ dir: cwd, outfile, dry: false }, { ...flags, version })
      const end = performance.now()

      if (!vsix) {
        throw new Error('There was an error while creating the VSIX package.')
      }

      if (vsix.dry) {
        console.log('Dry run, no package created.')
        console.log(`outfile: ${vsix.outfile}`)
        console.log(`<${vsix.manifest.name}> v${vsix.manifest.version}, with ${vsix.files.length} files :`)
        vsix.files.forEach((file) => {
          console.log(`  ${file.path}`)
        })
        return
      }

      const { files } = vsix

      const stats = await fs.promises.stat(vsix.outfile)

      let size = 0
      let unit = ''

      if (stats.size > 1048576) {
        size = Math.round(stats.size / 10485.76) / 100
        unit = 'MB'
      } else {
        size = Math.round(stats.size / 10.24) / 100
        unit = 'KB'
      }

      console.log(
        `Packaged: ${outfile} (${files.length} files in ${Math.round((end - start) / 10) / 100}s, ${size}${unit})`,
      )
    })

  cli.help()

  cli.version(pkgJson.version)

  cli.parse(process.argv, { run: false })
  await cli.runMatchedCommand()
}
