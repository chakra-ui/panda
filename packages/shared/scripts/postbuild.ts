import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const fileMap = [
  ['shared.mjs', 'helpers.mjs'],
  ['astish.mjs', 'astish.mjs'],
  ['normalize-html.mjs', 'normalize-html.mjs'],
]

async function main() {
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
