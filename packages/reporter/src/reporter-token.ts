import type { ParserOptions } from '@pandacss/core'
import type { AnalysisReport, PropertyReportItem, TokenDataTypes } from '@pandacss/types'

interface TokenAnalysisItem {
  tokenCategory: string
  usedInXFiles: number
  usedCount: number
  totalTokenInCategory: number
  percentUsed: number
  hardcoded: number
  mostUsedNames: string[]
}

type CategoryId = PropertyReportItem['index']

function getFileUsage(result: AnalysisReport, categoryIds: Set<CategoryId>) {
  const filePathMap = Array.from(result.derived.byFilepath.values())
  return filePathMap.reduce((acc, usedInFile) => {
    return acc + (Array.from(usedInFile).filter((idInFile) => categoryIds.has(idInFile)).length ? 1 : 0)
  }, 0)
}

function getUniqueTokenNames(result: AnalysisReport, categoryIds: Set<CategoryId>) {
  return Array.from(categoryIds).reduce((tokens, id) => {
    const item = result.propByIndex.get(id)
    if (item?.isKnownValue && item.value != null) {
      tokens.add(item.value.toString())
    }
    return tokens
  }, new Set<string>())
}

function countHardcodedTokens(result: AnalysisReport, categoryIds: Set<CategoryId>) {
  return Array.from(categoryIds).reduce((acc, id) => {
    return acc + (result.propByIndex.get(id)?.isKnownValue ? 0 : 1)
  }, 0)
}

export function analyzeTokens(ctx: ParserOptions, result: AnalysisReport): TokenReportEntry[] {
  const categoryMap = result.derived.globalMaps.byTokenType
  const categoryEntries = Array.from(categoryMap.entries())

  return categoryEntries.map(([category, categoryIds]): TokenAnalysisItem => {
    //
    const uniqueTokenNames = getUniqueTokenNames(result, categoryIds)
    const usedCount = uniqueTokenNames.size

    const tokens = ctx.tokens.view.categoryMap.get(category as keyof TokenDataTypes)
    const totalTokenInCategory = tokens?.size ?? 0
    const percentUsed = Math.ceil((usedCount / (totalTokenInCategory || 1)) * 10_000) / 100

    return {
      tokenCategory: category,
      // usedTokenNames: distinctTokenNames,
      totalTokenInCategory: totalTokenInCategory,
      usedInXFiles: getFileUsage(result, categoryIds),
      usedCount,
      percentUsed,
      hardcoded: countHardcodedTokens(result, categoryIds),
      mostUsedNames: Array.from(uniqueTokenNames).sort(
        (a, b) =>
          (result.derived.globalMaps.byTokenName.get(b)?.size ?? 0) -
          (result.derived.globalMaps.byTokenName.get(a)?.size ?? 0),
      ),
    }
  })
}

export interface TokenReportEntry {
  tokenCategory: string
  usedInXFiles: number
  usedCount: number
  totalTokenInCategory: number
  percentUsed: number
  hardcoded: number
  mostUsedNames: string[]
}
