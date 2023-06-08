import path from 'path'
import fs from 'fs'

import { createVsix } from '@pandacss/vsix-builder'

export async function createVsixCommand({ packageDir, outfile }: { packageDir: string; outfile: string }) {
  const start = performance.now()
  const vsix = await createVsix({ dir: packageDir, outfile, dry: false })
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
}

const cwd = process.cwd()
createVsixCommand({ packageDir: cwd, outfile: path.join(cwd, 'panda.vsix') })
