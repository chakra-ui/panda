import { fixtureDefaults } from '@pandacss/fixture'
import type { LoadConfigResult, StaticCssOptions } from '@pandacss/types'
import { describe, expect, test } from 'vitest'
import { Generator } from '../src'

const createSplitCssContext = (staticCss: StaticCssOptions) => {
  const config: LoadConfigResult = {
    ...fixtureDefaults,
    config: {
      ...fixtureDefaults.config,
      staticCss,
    },
  }

  const generator = new Generator(config)
  const sheet = generator.createSheet()

  generator.appendLayerParams(sheet)
  generator.appendBaselineCss(sheet)

  const artifacts = generator.getSplitCssArtifacts(sheet)

  return {
    generator,
    sheet,
    artifacts,
    recipeKeys: generator.recipes.keys,
    recipeNames: artifacts.recipes.map((r) => r.name),
    recipeFiles: artifacts.recipes.map((r) => r.file),
  }
}

describe('split CSS generation', () => {
  test('staticCss recipes: "*" should include all recipes', () => {
    const { recipeKeys, recipeNames } = createSplitCssContext({ recipes: '*' })

    for (const recipeName of recipeKeys) {
      expect(recipeNames).toContain(recipeName)
    }
  })

  test('should generate separate CSS files for each recipe', () => {
    const { recipeKeys, recipeFiles, artifacts } = createSplitCssContext({ recipes: '*' })

    // Number of recipe CSS files should match the number of recipe keys
    expect(artifacts.recipes.length).toBe(recipeKeys.length)

    // Verify all recipe file names
    expect(recipeFiles.sort()).toMatchInlineSnapshot(`
      [
        "badge.css",
        "button-style.css",
        "card-style.css",
        "checkbox.css",
        "text-style.css",
        "tooltip-style.css",
      ]
    `)

    // Each recipe should have non-empty CSS
    artifacts.recipes.forEach((recipe) => {
      expect(recipe.code.trim().length).toBeGreaterThan(0)
      expect(recipe.file).toMatch(/\.css$/)
      expect(recipe.dir).toBe('recipes')
    })
  })
})
