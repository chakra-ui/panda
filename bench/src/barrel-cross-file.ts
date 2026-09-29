/**
 * Cross-file folding through an `export *` barrel: a design system with one file per component,
 * re-exported from `ds/index.ts`, and app files that import recipes, tokens, helpers, and
 * components through it. Reports extraction and transform time, folds, and peak memory.
 *
 *   pnpm --filter=./bench barrel-cross-file              # 300 components, 300 app files
 *   COMPONENTS=1000 PAGES=1000 pnpm --filter=./bench barrel-cross-file
 *   BARREL=named pnpm --filter=./bench barrel-cross-file   # same fixture through `export { … } from`
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { performance } from 'node:perf_hooks'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createNodeDriver } from '@pandacss/compiler'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../..')
const outDir = join(repoRoot, 'bench', '.barrel-cross-file-out')
const COMPONENTS = Number(process.env.COMPONENTS ?? 300)
const PAGES = Number(process.env.PAGES ?? 300)
const RUNS = Number(process.env.RUNS ?? 5)
/** `star` (`export * from`) or `named` (`export { … } from`), to isolate what star lookups cost. */
const BARREL = process.env.BARREL === 'named' ? 'named' : 'star'

function writeFixture(): { files: string[]; pages: string[] } {
  rmSync(outDir, { recursive: true, force: true })
  mkdirSync(join(outDir, 'src', 'ds'), { recursive: true })
  mkdirSync(join(outDir, 'src', 'app'), { recursive: true })
  writeFileSync(
    join(outDir, 'panda.config.mjs'),
    `export default { presets: ['@pandacss/preset-base'], preflight: false, jsxFramework: 'react', include: ['./src/**/*.{ts,tsx}'], outdir: 'styled-system' }\n`,
  )

  const files: string[] = []
  for (let i = 0; i < COMPONENTS; i++) {
    const file = join(outDir, 'src', 'ds', `c${i}.tsx`)
    writeFileSync(
      file,
      [
        "import { cva } from '../../styled-system/css'",
        `export const recipe${i} = cva({`,
        `  base: { display: 'flex', padding: '${i}px' },`,
        `  variants: { size: { sm: { fontSize: '12px' }, lg: { fontSize: '${(i % 20) + 10}px' } } },`,
        '})',
        `export const token${i} = 'red.${(i % 9) + 1}00'`,
        `export function helper${i}(value) { return globalThis.format(value) }`,
        `export function Comp${i}(props) { return props.children }`,
        '',
      ].join('\n'),
    )
    files.push(file)
  }
  const barrel = join(outDir, 'src', 'ds', 'index.ts')
  const reExport = (i: number) =>
    BARREL === 'named'
      ? `export { recipe${i}, token${i}, helper${i}, Comp${i} } from './c${i}'`
      : `export * from './c${i}'`
  writeFileSync(barrel, Array.from({ length: COMPONENTS }, (_, i) => reExport(i)).join('\n') + '\n')
  files.push(barrel)

  const pages: string[] = []
  for (let j = 0; j < PAGES; j++) {
    const [a, b, c, d] = [j, j * 7, j * 13, j * 17].map((n) => n % COMPONENTS)
    const file = join(outDir, 'src', 'app', `p${j}.tsx`)
    writeFileSync(
      file,
      [
        "import { css } from '../../styled-system/css'",
        `import { recipe${a}, token${b}, helper${c}, Comp${d} } from '../ds'`,
        `export const cls = recipe${a}({ size: 'lg' })`,
        `export const title = css({ color: token${b} })`,
        `export const text = helper${c}('x')`,
        `export const el = <Comp${d}>hi</Comp${d}>`,
        '',
      ].join('\n'),
    )
    pages.push(file)
  }
  files.push(...pages)
  return { files, pages }
}

const median = (values: number[]) => [...values].sort((x, y) => x - y)[Math.floor(values.length / 2)]!
const ms = (value: number) => `${value.toFixed(1)} ms`

async function main() {
  const { files, pages } = writeFixture()
  const transformerDist = join(repoRoot, 'packages', 'transformer', 'dist', 'index.js')
  const { createSourceTransformer } = await import(pathToFileURL(transformerDist).href)

  const extract: number[] = []
  const coldTransform: number[] = []
  const warmTransform: number[] = []
  let cssBytes = 0
  let folded = 0
  let tokenRules = 0

  for (let run = 0; run < RUNS; run++) {
    const driver = await createNodeDriver({ cwd: outDir })
    let start = performance.now()
    driver.compiler.parseFiles(files)
    const css = driver.compiler.getLayerCss({ layers: ['recipes', 'utilities'] }).css
    extract.push(performance.now() - start)
    cssBytes = css.length
    tokenRules = (css.match(/\.c_red\\\.\d00 /g) ?? []).length

    const transformer = createSourceTransformer(driver.compiler)
    const transformAll = () => pages.map((path) => transformer.transformSource({ path, source: readSource(path) }))
    start = performance.now()
    const results = transformAll()
    coldTransform.push(performance.now() - start)
    start = performance.now()
    transformAll()
    warmTransform.push(performance.now() - start)
    folded = results.filter((result: { code: string }) => !/\brecipe\d+\(/.test(result.code)).length
  }

  const { maxRSS } = process.resourceUsage()
  console.log(`${COMPONENTS} components behind a ${BARREL} barrel, ${PAGES} app files, medians of ${RUNS}`)
  console.log(`  extract + css   ${ms(median(extract))}`)
  console.log(`  transform cold  ${ms(median(coldTransform))}`)
  console.log(`  transform warm  ${ms(median(warmTransform))}`)
  console.log(`  recipe calls folded  ${folded} / ${PAGES}`)
  console.log(`  token color rules    ${tokenRules}`)
  console.log(`  css bytes            ${cssBytes}`)
  console.log(`  peak rss             ${(maxRSS / 1024).toFixed(0)} MB`)
}

const sources = new Map<string, string>()
function readSource(path: string) {
  let source = sources.get(path)
  if (source === undefined) {
    source = readFileSync(path, 'utf8')
    sources.set(path, source)
  }
  return source
}

main()
