import { generateDtsBundle } from 'dts-bundle-generator'
import path from 'path'
import fs from 'fs/promises'

console.time('bundle-types')
const __dirname = new URL('.', import.meta.url).pathname
const tsconfigPath = path.join(__dirname, '../tsconfig.json')
const dts = (relative: string) => path.join(__dirname, '../node_modules/' + relative)

const dtsFiles = {
  ['@pandacss/dev']: dts('@pandacss/dev/dist/index.d.ts'),
  ['react']: dts('@types/react/index.d.ts'),
}

console.log('Generating dts bundles...')
const bundledDts = generateDtsBundle([{ filePath: path.join(__dirname, 'panda-types.ts') }], {
  preferredConfigPath: tsconfigPath,
})

const outdir = path.join(__dirname, '../src/dts/')
console.log('Writing dts bundles in', outdir)

await getOrCreateDir(outdir)
await fs.writeFile(outdir + '@pandacss/types'.replace('/', '_') + '.d.ts', bundledDts[0])
await Promise.all(
  Object.keys(dtsFiles).map((name) => {
    console.log('Copying', name)
    return fs.copyFile((dtsFiles as any)[name], outdir + name.replace('/', '_') + '.d.ts')
  }),
)

console.log('Done !')
console.timeEnd('bundle-types')

async function getOrCreateDir(dir: string) {
  try {
    await fs.mkdir(dir)
  } catch (e) {
    // ignore
  }
}
