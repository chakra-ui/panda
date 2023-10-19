import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const fileMap = [['index.mjs', 'is-valid-prop.mjs']]

async function main() {
  console.log("Postbuild: Copying is-valid-prop to generator's artifacts")
  fileMap.forEach(([input, outfile]) => {
    const inputPath = join(__dirname, '..', 'dist', input)
    const content = readFileSync(inputPath, 'utf8')

    const packagesDir = join(__dirname, '..', '..')
    const generatorPath = join(packagesDir, 'generator')
    const outPath = join(generatorPath, 'src', 'artifacts', 'generated', outfile + '.json')
    writeFileSync(outPath, JSON.stringify({ content }, null, 2), 'utf8')
  })
}

main()
