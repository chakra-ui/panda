import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { getCssTypesComments } from './save-csstype-comments'

const fileMap = [
  'csstype.d.ts',
  'system-types.ts',
  'selectors.ts',
  'recipe.ts',
  'pattern.ts',
  'parts.ts',
  'static-css.ts',
  'composition.ts',
]

export async function main() {
  fileMap.forEach((input) => {
    const inputPath = join(__dirname, '..', 'src', input)
    let content = readFileSync(inputPath, 'utf8').replace("'./tokens'", "'../tokens'")

    if (input.includes('system-types.ts')) {
      content = content.replace(
        /Nested<\((SystemProperties \| GenericProperties)\) & CssVarProperties>/,
        "Omit<Nested<SystemProperties & CssVarProperties>, 'base'>",
      )
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

    const result = { content } as any
    if (input.includes('csstype.d.ts')) {
      const comments = getCssTypesComments()
      result.comments = comments
    }

    writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8')
  })

  console.log('[postbuild] Copied types to packages/generator/src/artifacts ✅')
}

if (process.env.PANDA_BUILD) {
  main()
}
