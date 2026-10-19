import { expect, it } from 'vitest'
import { createCompiler } from '../src'
import { describeIfBuilt, describeMissingWasm, importMap } from './helpers'

describeIfBuilt('@pandacss/compiler-wasm usage requirements', () => {
  it('reports global and static recipe dependencies without adding parsed files', async () => {
    const compiler = await createCompiler({
      cwd: '/virtual',
      outdir: 'styled-system',
      importMap,
      utilities: {
        color: { values: 'colors' },
        animationName: { values: 'keyframes' },
      },
      theme: {
        tokens: { colors: { brand: { value: '#f00' } } },
        keyframes: {
          globalMotion: { to: { opacity: 1 } },
          recipeMotion: { to: { opacity: 1 } },
          unusedMotion: { to: { opacity: 1 } },
        },
        recipes: {
          badge: { base: { animationName: 'recipeMotion' } },
          unused: { base: { animationName: 'unusedMotion' } },
        },
      },
      globalCss: { body: { color: 'brand', animationName: 'globalMotion' } },
      staticCss: { recipes: { badge: [{}] } },
    })
    const before = compiler.summary()
    const result = compiler.inspectUsageRequirements([])

    expect(result.diagnostics).toEqual([])
    expect(compiler.summary()).toEqual(before)
    expect(result.requirements.filter((entry) => entry.kind !== 'utility')).toMatchInlineSnapshot(`
      [
        {
          "kind": "keyframe",
          "name": "globalMotion",
          "reasons": [
            "globalCss",
          ],
        },
        {
          "kind": "keyframe",
          "name": "recipeMotion",
          "reasons": [
            "staticCss.recipes.badge",
          ],
        },
        {
          "kind": "recipe",
          "name": "badge",
          "reasons": [
            "staticCss.recipes.badge",
          ],
        },
        {
          "kind": "token",
          "name": "colors.brand",
          "reasons": [
            "globalCss",
          ],
        },
      ]
    `)
  })
})

describeMissingWasm()
