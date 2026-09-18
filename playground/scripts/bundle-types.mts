import { generateDtsBundle } from 'dts-bundle-generator'
import path from 'path'
import fs from 'fs/promises'

console.time('bundle-types')
const __dirname = new URL('.', import.meta.url).pathname
const tsconfigPath = path.join(__dirname, '../tsconfig.json')
const dts = (relative: string) => path.join(__dirname, '../node_modules/' + relative)
const outfile = (name: string) => path.join(__dirname, '../src/dts/', name.replaceAll('/', '_') + '.d.ts')

// Inlined, not re-exported: the editor resolves neither a bare package specifier
// nor @pandacss/dev's './define.js' sibling.
const bundles = [
  { name: '@pandacss/types', entry: 'panda-types.ts' },
  { name: '@pandacss/dev', entry: 'panda-dev.ts' },
]

const copies = {
  ['react']: dts('@types/react/index.d.ts'),
}

console.log('Generating dts bundles...')
const bundledDts = generateDtsBundle(
  bundles.map(({ name, entry }) => ({
    filePath: path.join(__dirname, entry),
    libraries: { inlinedLibraries: [name] },
  })),
  { preferredConfigPath: tsconfigPath },
)

const outdir = path.join(__dirname, '../src/dts/')
console.log('Writing dts bundles in', outdir)

await getOrCreateDir(outdir)
await Promise.all(
  bundles.map(({ name }, index) => {
    console.log('Bundling', name)
    return fs.writeFile(outfile(name), bundledDts[index])
  }),
)
await Promise.all(
  Object.keys(copies).map((name) => {
    console.log('Copying', name)
    return fs.copyFile((copies as any)[name], outfile(name))
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
