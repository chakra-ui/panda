import type { ParserOptions } from '@pandacss/core'
import { uniq } from '@pandacss/shared'
import type { AnalysisReport, Nullable, TokenDataTypes } from '@pandacss/types'

const formatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
})

const getPercent = (used: number, total: number) => {
  return Number(formatter.format((used / (total || 1)) * 100))
}

export function analyzeTokens(ctx: ParserOptions, result: AnalysisReport): TokenAnalysisReport {
  const categoryMap = result.derived.globalMaps.byTokenType
  const categoryEntries = Array.from(categoryMap.entries())

  const usageMap: Map<string, TokenUsageItem[]> = new Map()
  const totalMap: Map<string, number> = new Map()

  categoryEntries.forEach(([category, categoryIds]) => {
    const usage = usageMap.get(category) || usageMap.set(category, []).get(category)!

    categoryIds.forEach((id) => {
      // get the token item
      const item = result.propByIndex.get(id)
      if (item?.value == null) return

      const type = item.isKnownValue ? 'token' : 'nonToken'
      const value = item.value.toString()
      const filePath = item.filepath
      const loc = item.range
        ? {
            line: item.range.startLineNumber,
            column: item.range.startColumn,
          }
        : null

      usage.push({ category, value, filePath, loc, type })
    })

    const totalTokens = ctx.tokens.view.categoryMap.get(category as keyof TokenDataTypes)?.size ?? 0
    totalMap.set(category, totalTokens)
  })

  const usageEntries = Array.from(usageMap.entries())

  const percentMap = usageEntries.reduce((map, [category, usage]) => {
    const total = totalMap.get(category) ?? 0
    const tokens = usage.reduce((acc, item) => {
      return item.type === 'token' ? acc.add(item.value) : acc
    }, new Set<string>())

    const percent = getPercent(tokens.size, total)
    return map.set(category, {
      total,
      used: tokens.size,
      unused: total - tokens.size,
      percent,
    })
  }, new Map<string, { total: number; used: number; unused: number; percent: number }>())

  const tokenNameMap = usageEntries.reduce((map, [category, usage]) => {
    const existing = map.get(category) ?? []
    usage.forEach(({ value, type }) => {
      if (type === 'token') existing.push(value)
    })
    const sorted = uniq(existing).sort(
      (a, b) =>
        (result.derived.globalMaps.byTokenName.get(b)?.size ?? 0) -
        (result.derived.globalMaps.byTokenName.get(a)?.size ?? 0),
    )
    return map.set(category, sorted)
  }, new Map<string, string[]>())

  const fileUsageMap = usageEntries.reduce((map, [category, usage]) => {
    const existing = map.get(category) ?? new Set()
    usage.forEach(({ filePath }) => {
      if (filePath.startsWith('@config')) return
      existing.add(filePath)
    })
    return map.set(category, existing)
  }, new Map<string, Set<string>>())

  const hardcodedTokenMap = usageEntries.reduce((map, [category, usage]) => {
    const items = new Set<string>()
    usage.forEach(({ type, value }) => {
      if (type === 'nonToken') items.add(value)
    })
    return map.set(category, items.size)
  }, new Map<string, number>())

  return {
    usageMap,
    percentMap,
    tokenNameMap,
    fileUsageMap,
    hardcodedTokenMap,
    totalMap,
    getSummary() {
      const summary = categoryEntries.map(([category]) => {
        const percent = percentMap.get(category)
        return {
          category,
          count: percent?.total ?? 0,
          usedInXFiles: fileUsageMap.get(category)?.size ?? 0,
          usedCount: percent?.used ?? 0,
          percentUsed: percent?.percent ?? 0,
          hardcoded: hardcodedTokenMap.get(category) ?? 0,
          mostUsedNames: tokenNameMap.get(category)?.slice(0, 5) ?? [],
        }
      })
      return summary.sort((a, b) => b.percentUsed - a.percentUsed)
    },
  }
}

export interface TokenUsageItem {
  category: string
  value: string
  filePath: string
  type: 'token' | 'nonToken'
  loc: Nullable<{ line: number; column: number }>
}

export interface TokenReportEntry {
  category: string
  usedInXFiles: number
  usedCount: number
  count: number
  percentUsed: number
  hardcoded: number
  mostUsedNames: string[]
}

export interface TokenAnalysisReport {
  usageMap: Map<string, TokenUsageItem[]>
  percentMap: Map<string, { total: number; used: number; unused: number; percent: number }>
  tokenNameMap: Map<string, string[]>
  fileUsageMap: Map<string, Set<string>>
  hardcodedTokenMap: Map<string, number>
  totalMap: Map<string, number>
  getSummary(): TokenReportEntry[]
}
