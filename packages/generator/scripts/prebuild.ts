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
  ['@pandacss/types', ['csstype.d.ts', 'system-types.d.ts', 'selectors.d.ts', 'recipe.d.ts', 'composition.d.ts']],
  ['@pandacss/is-valid-prop', [['index.mjs', 'is-valid-prop.mjs']]],
  ['@pandacss/shared', [['shared.mjs', 'helpers.mjs']]],
] as const

async function main() {
  fileMap.forEach(([pkg, files]) => {
    //@ts-expect-error
    files.forEach((file: string | string[]) => {
      const [input, output = input] = Array.isArray(file) ? file : [file, file]
      const filepath = getEntrypoint(pkg, input)
      const content = readFileSync(filepath, 'utf8')
      const outPath = join(__dirname, '..', 'src', 'artifacts', 'generated', basename(output) + '.json')
      writeFileSync(outPath, JSON.stringify({ content }, null, 2), 'utf8')
    })
  })
}

main()
