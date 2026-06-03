import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const fileMap = [
  ['shared.js', 'helpers.mjs'],
  ['astish.js', 'astish.mjs'],
  ['normalize-html.js', 'normalize-html.mjs'],
]

async function main() {
  fileMap.forEach(([input, outfile]) => {
    const inputPath = join(import.meta.dirname, '..', 'dist', input)
    const content = readFileSync(inputPath, 'utf8')

    const packagesDir = join(import.meta.dirname, '..', '..')
    const generatorPath = join(packagesDir, 'generator')
    const outPath = join(generatorPath, 'src', 'artifacts', 'generated', outfile + '.json')
    writeFileSync(outPath, JSON.stringify({ content }, null, 2), 'utf8')
  })
  console.log('[postbuild] Copied shared to packages/generator/src/artifacts ✅')
}

main()
