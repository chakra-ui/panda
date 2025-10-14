import { z } from 'zod'
import { loadPandaContext } from '../load-config'

// Schema definitions
export const listRecipesSchema = z.object({})

export const getRecipeSchema = z.object({
  recipeName: z.string().describe('The recipe name to get details for'),
})

export const getRecipePropsSchema = z.object({
  recipeName: z.string().describe('The recipe name to get properties for'),
})

export const recipesSchema = z.object({
  includeConfig: z.boolean().optional().describe('Include recipe configuration details'),
})

// Tool implementations
export async function listRecipes(args: z.infer<typeof listRecipesSchema>): Promise<string[]> {
  const ctx = await loadPandaContext()
  const recipes = ctx.recipes as any

  try {
    const recipeNames = recipes.getRecipeNames?.() || Object.keys(ctx.config.theme?.recipes || {})
    return recipeNames
  } catch (error) {
    return []
  }
}

export async function getRecipe(args: z.infer<typeof getRecipeSchema>): Promise<any> {
  const ctx = await loadPandaContext()
  const { recipeName } = args
  const recipes = ctx.recipes as any

  try {
    const recipeConfig = recipes.getConfig?.(recipeName) || ctx.config.theme?.recipes?.[recipeName]

    if (!recipeConfig) {
      return {
        error: `Recipe "${recipeName}" not found`,
      }
    }

    // Determine if it's a slot recipe
    const isSlotRecipe =
      (recipeConfig as any).slots &&
      Array.isArray((recipeConfig as any).slots) &&
      (recipeConfig as any).slots.length > 0

    // Extract variant keys
    const variants: Record<string, any[]> = {}
    if ((recipeConfig as any).variants) {
      for (const [variantName, variantValues] of Object.entries((recipeConfig as any).variants)) {
        variants[variantName] = Object.keys(variantValues as any)
      }
    }

    // Generate usage example
    const usage = `import { ${recipeName} } from 'styled-system/recipes'
 
function App() {
  return (
    <div>
      <button className={${recipeName}()}>Click me</button>
      <button className={${recipeName}({ ${Object.keys(variants)[0] || 'variant'}: '${variants[Object.keys(variants)[0]]?.[0] || 'value'}' })}>Click me</button>
    </div>
  )
}`

    return {
      type: isSlotRecipe ? 'slotRecipe' : 'recipe',
      name: recipeName,
      className: (recipeConfig as any)?.className || recipeName,
      description: (recipeConfig as any).description || '',
      variants,
      defaultVariants: (recipeConfig as any).defaultVariants || {},
      usage,
      ...(isSlotRecipe && { slots: (recipeConfig as any).slots }),
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : `Failed to get recipe "${recipeName}"`,
    }
  }
}

export async function getRecipeProps(args: z.infer<typeof getRecipePropsSchema>): Promise<any> {
  const ctx = await loadPandaContext()
  const { recipeName } = args

  const recipes = ctx.recipes as any

  try {
    const config = recipes.getConfig?.(recipeName) || ctx.config.theme?.recipes?.[recipeName]

    if (!config) {
      return {
        error: `Recipe "${recipeName}" not found`,
        availableRecipes: recipes.getRecipeNames?.() || Object.keys(ctx.config.theme?.recipes || {}),
      }
    }

    const props = recipes.getRecipeProps?.(recipeName) || {}

    return {
      recipe: recipeName,
      props,
      variants: (config as any)?.variants || {},
      defaultVariants: (config as any)?.defaultVariants || {},
      compoundVariants: (config as any)?.compoundVariants || [],
      className: recipes.getClassName?.(recipeName, '', {}) || recipeName,
      description: (config as any)?.description,
    }
  } catch (error) {
    return {
      error: `Could not access recipe information for "${recipeName}"`,
      availableRecipes: [],
    }
  }
}

export async function getRecipes(args: z.infer<typeof recipesSchema>): Promise<any> {
  const ctx = await loadPandaContext()
  const { includeConfig = false } = args

  const recipes = ctx.recipes as any

  try {
    const recipeNames = recipes.getRecipeNames?.() || Object.keys(ctx.config.theme?.recipes || {})

    const result = {
      summary: {
        total: recipeNames.length,
        recipes: recipeNames,
      },
      recipes: [] as any[],
    }

    if (includeConfig) {
      for (const recipeName of recipeNames) {
        const config = recipes.getConfig?.(recipeName) || ctx.config.theme?.recipes?.[recipeName]
        const props = recipes.getRecipeProps?.(recipeName) || {}

        result.recipes.push({
          name: recipeName,
          className: recipes.getClassName?.(recipeName, '', {}) || recipeName,
          config,
          props,
          variants: Object.keys((config as any)?.variants || {}),
          variantCount: Object.keys((config as any)?.variants || {}).length,
        })
      }
    }

    return result
  } catch (error) {
    return {
      summary: {
        total: 0,
        recipes: [],
      },
      recipes: [],
      error: 'Could not access recipe information',
    }
  }
}
