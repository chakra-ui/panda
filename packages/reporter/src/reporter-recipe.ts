import type { ParserOptions } from '@pandacss/core'
import type { AnalysisReport, ComponentReportItem } from '@pandacss/types'

export interface RecipeReportEntry {
  recipeName: string
  usedInXFiles: number
  usedCount: number
  variantCount: number
  usedCombinations: number
  percentUsed: number
  jsxPercentUsed: number
  fnPercentUsed: number
  possibleCombinations: string[]
  unusedCombinations: number
  mostUsedCombinations: string[]
}

export function analyzeRecipes(ctx: ParserOptions, result: AnalysisReport): RecipeReportEntry[] {
  const recipesReportItems = Array.from(result.componentByIndex.values()).filter(
    (reportItem) => reportItem.reportItemType === 'recipe' || reportItem.reportItemType === 'jsx-recipe',
  )

  const recipeReportMap = new Map<string, Set<ComponentReportItem>>()

  recipesReportItems.forEach((reportItem) => {
    const recipeOrComponentName = reportItem.componentName
    const recipe = ctx.recipes.details.find(
      (node) => node.match.test(recipeOrComponentName) || node.baseName === recipeOrComponentName,
    )
    if (!recipe) return

    const recipeName = recipe?.baseName

    if (!recipeReportMap.has(recipeName)) {
      recipeReportMap.set(recipeName, new Set())
    }

    recipeReportMap.get(recipeName)!.add(reportItem)
  })

  const reportMap = Array.from(recipeReportMap.entries())
  const normalizedReportMap = reportMap.map(
    ([recipeName, reportItems]) => [recipeName, Array.from(reportItems)] as const,
  )

  return normalizedReportMap.map(([recipeName, reportItems]): RecipeReportEntry => {
    const usedCombinations = reportItems
      .map((component) =>
        component.contains
          .map((id) => {
            const reportItem = result.propByIndex.get(id)!
            const recipe = ctx.recipes.getRecipe(recipeName)
            if (!recipe?.variantKeys.includes(reportItem.propName)) return
            return reportItem.propName + '.' + reportItem.value
          })
          .filter(Boolean),
      )
      .flat() as string[]

    const distinctUsedCombinations = Array.from(new Set(usedCombinations)).sort()
    const usedCount = reportItems.length

    const recipe = ctx.recipes.getRecipe(recipeName)!
    const variantMap = recipe.variantKeyMap ?? {}
    const possibleCombinations = Object.keys(variantMap).reduce((acc, variantName) => {
      return acc.concat(variantMap[variantName].map((value) => `${variantName}.${value}`))
    }, [] as string[])

    const variantCount = recipe.variantKeys.length
    const percentUsed = Math.ceil((distinctUsedCombinations.length / (possibleCombinations.length || 1)) * 10_000) / 100

    const jsxUsage = reportItems.filter((component) => component.reportItemType === 'jsx-recipe')
    const fnUsage = reportItems.filter((component) => component.reportItemType === 'recipe')

    const jsxPercentUsed = Math.ceil((jsxUsage.length / (reportItems.length || 1)) * 100)
    const fnPercentUsed = Math.ceil((fnUsage.length / (reportItems.length || 1)) * 100)

    const usedInXFiles = new Set(reportItems.flatMap((component) => component.filepath)).size

    return {
      recipeName,
      usedInXFiles,
      usedCount,
      variantCount,
      possibleCombinations,
      usedCombinations: distinctUsedCombinations.length,
      percentUsed,
      jsxPercentUsed,
      fnPercentUsed,
      unusedCombinations: possibleCombinations.length - distinctUsedCombinations.length,
      mostUsedCombinations: distinctUsedCombinations,
    }
  })
}
