import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createCompiler } from '@pandacss/compiler'
import { describe, expect, it } from 'vitest'
import { createSourceTransformer } from '../src'
import { run } from './fixtures/styled-system'

type Props = Record<string, unknown>

const dir = join(__dirname, 'fixtures/recipe-parity')
const recipesSource = readFileSync(join(dir, 'recipes.js'), 'utf8')

/**
 * Every prop combination each fixture recipe is called with; `undefined` means the prop is omitted.
 * `null` is passed through: unlike an omitted prop, it doesn't fall back to the default.
 */
const matrix: Record<string, Record<string, unknown[]>> = {
  shorthand: { tone: [undefined, 'blue', 'green'] },
  conditions: { size: [undefined, 'sm', 'lg'] },
  compounds: {
    size: [undefined, null, 'sm', 'md', 'lg'],
    tone: [undefined, 'solid', 'ghost'],
    disabled: [undefined, null, true, false],
  },
  important: { tone: [undefined, 'blue', 'loud'] },
  tabs: { size: [undefined, null, 'sm', 'lg'], fitted: [undefined, true] },
  grid: { cols: [undefined, null, 1, '1', 2, '2'], dense: [undefined, true, 'true', false] },
}

function combinations(axes: Record<string, unknown[]>): Props[] {
  return Object.entries(axes).reduce<Props[]>(
    (all, [key, values]) =>
      all.flatMap((props) => values.map((value) => (value === undefined ? props : { ...props, [key]: value }))),
    [{}],
  )
}

const calls = Object.entries(matrix).flatMap(([recipe, axes]) => combinations(axes).map((props) => ({ recipe, props })))

const callerSource = [
  `import { ${Object.keys(matrix).join(', ')} } from './recipes'`,
  `export { ${Object.keys(matrix).join(', ')} }`,
  'export const folded = [',
  ...calls.map(({ recipe, props }) => `  ${recipe}(${JSON.stringify(props)}),`),
  ']',
  'export const foldedRaw = [',
  ...calls.map(({ recipe, props }) => `  ${recipe}.raw(${JSON.stringify(props)}),`),
  ']',
].join('\n')

/** Class order carries no meaning; duplicates would, so they're kept. */
function normalize(value: unknown): unknown {
  if (typeof value === 'string') return value.split(/\s+/).filter(Boolean).sort()
  return Object.fromEntries(Object.entries(value as Props).map(([slot, classes]) => [slot, normalize(classes)]))
}

function createParityCompiler() {
  return createCompiler({
    cwd: dir,
    outdir: 'styled-system',
    outExtension: 'mjs',
    jsxFramework: 'react',
    importMap: { css: ['@panda/css'], recipe: ['@panda/recipes'], pattern: ['@panda/patterns'], jsx: ['@panda/jsx'] },
    conditions: { hover: '&:hover' },
    theme: { breakpoints: { md: '768px' } },
    utilities: {
      backgroundColor: { className: 'bg', shorthand: 'bg' },
      color: { className: 'c' },
      fontSize: { className: 'fs' },
      padding: { className: 'p' },
      margin: { className: 'm' },
      opacity: { className: 'op' },
      display: { className: 'd' },
      width: { className: 'w' },
      flex: { className: 'flex' },
    },
  })
}

describe('imported recipe calls fold to what the runtime returns', () => {
  it(`agrees with the transformed and the styled-system recipe on all ${calls.length} calls`, async () => {
    const compiler = createParityCompiler()
    const transformer = createSourceTransformer(compiler)
    const transform = (file: string, source: string) =>
      transformer.transformSource({ path: join(dir, file), source }).code

    const foldedCaller = transform('app.tsx', callerSource)
    const unfoldedCalls = foldedCaller.match(new RegExp(`\\b(${Object.keys(matrix).join('|')})(\\.raw)?\\(`, 'g')) ?? []
    expect(unfoldedCalls).toEqual([])

    const transformed = await run(compiler, foldedCaller, { '/recipes.js': transform('recipes.js', recipesSource) })
    const original = await run(compiler, callerSource, { '/recipes.js': recipesSource })

    const mismatches = calls.flatMap(({ recipe, props }, index) => {
      const folded = normalize(transformed.folded[index])
      const runtime = normalize(transformed[recipe](props))
      const styledSystem = normalize(original[recipe](props))
      const agree =
        JSON.stringify(folded) === JSON.stringify(runtime) && JSON.stringify(runtime) === JSON.stringify(styledSystem)
      return agree ? [] : [{ recipe, props, folded, runtime, styledSystem }]
    })
    expect(mismatches).toEqual([])

    const rawMismatches = calls.flatMap(({ recipe, props }, index) => {
      const folded = transformed.foldedRaw[index]
      const styledSystem = original[recipe].raw(props)
      return JSON.stringify(folded) === JSON.stringify(styledSystem) ? [] : [{ recipe, props, folded, styledSystem }]
    })
    expect(rawMismatches).toEqual([])
  })

  it('only folds to classes the stylesheet defines', async () => {
    const compiler = createParityCompiler()
    compiler.parseFileSource(join(dir, 'recipes.js'), recipesSource)
    const css = compiler.getLayerCss({ layers: ['utilities'] }).css
    const defined = new Set([...css.matchAll(/\.((?:\\.|[\w-])+)/g)].map((match) => match[1]!.replace(/\\(.)/g, '$1')))

    const transformer = createSourceTransformer(compiler)
    const foldedCaller = transformer.transformSource({ path: join(dir, 'app.tsx'), source: callerSource }).code
    const transformed = await run(compiler, foldedCaller, {
      '/recipes.js': transformer.transformSource({ path: join(dir, 'recipes.js'), source: recipesSource }).code,
    })

    const folded = (transformed.folded as unknown[]).flatMap((value) =>
      typeof value === 'string' ? [value] : Object.values(value as Record<string, string>),
    )
    // `className__slot` hooks are for authors to target; the stylesheet doesn't define them.
    const missing = [...new Set(folded.flatMap((classes) => classes.split(' ')))].filter(
      (name) => name && !name.includes('__') && !defined.has(name),
    )
    expect(missing).toEqual([])
  })
})
