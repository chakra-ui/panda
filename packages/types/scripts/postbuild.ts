import { watch } from 'chokidar'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const fileMap = [
  'csstype.d.ts',
  'system-types.ts',
  'selectors.ts',
  'recipe.ts',
  'pattern.ts',
  'parts.ts',
  'composition.ts',
]

async function main() {
  fileMap.forEach((input) => {
    const inputPath = join(__dirname, '..', 'src', input)
    let content = readFileSync(inputPath, 'utf8').replace("'./tokens'", "'../tokens'")

    if (input.includes('system-types.d.ts')) {
      content = content.replace('(SystemProperties | GenericProperties)', 'SystemProperties')
    }

    const packagesDir = join(__dirname, '..', '..')
    const generatorPath = join(packagesDir, 'generator')
    const outPath = join(
      generatorPath,
      'src',
      'artifacts',
      'generated',
      (input.endsWith('.d.ts') ? input : input.replace('.ts', '.d.ts')) + '.json',
    )
    writeFileSync(outPath, JSON.stringify({ content }, null, 2), 'utf8')
  })
}

main().then(() => {
  watch(join(__dirname, '..', 'src')).on('change', () => {
    console.log('Rebuild types')
    main()
  })
})
