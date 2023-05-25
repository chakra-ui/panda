import { readFileSync, writeFileSync } from 'fs'
import { basename, dirname, join } from 'path'

function getEntrypoint(pkg: string, file: string) {
  const entry = require.resolve(pkg)
  const isDist = entry.includes('dist')
  const isType = pkg.includes('/types')
  if (isType) {
    return join(dirname(entry), file)
  }
  if (!isDist) {
    return join(dirname(entry), 'src', file)
  }
  return join(dirname(entry), file)
}

const fileMap = [
  [
    '@pandacss/types',
    [
      ['csstype.d.ts'],
      ['system-types.d.ts'],
      ['selectors.d.ts'],
      ['recipe.d.ts'],
      ['pattern.d.ts'],
      ['parts.d.ts'],
      ['composition.d.ts'],
    ],
  ],
  ['@pandacss/is-valid-prop', [['index.mjs', 'is-valid-prop.mjs']]],
  ['@pandacss/shared', [['shared.mjs', 'helpers.mjs']]],
] as const

async function main() {
  fileMap.forEach(([pkg, files]) => {
    files.forEach((file: any) => {
      const [input, output = input] = file
      const filepath = getEntrypoint(pkg, input)

      let content = readFileSync(filepath, 'utf8').replace("'./tokens'", "'../tokens'")

      if (filepath.includes('system-types.d.ts')) {
        content = content.replace('(SystemProperties | GenericProperties)', 'SystemProperties')
      }

      const outPath = join(__dirname, '..', 'src', 'artifacts', 'generated', basename(output) + '.json')
      writeFileSync(outPath, JSON.stringify({ content }, null, 2), 'utf8')
    })
  })
}

main()
