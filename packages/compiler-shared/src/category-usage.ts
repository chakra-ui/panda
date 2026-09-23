import type { UsageReport } from './types'

export interface TokenUse {
  name: string
  uses: number
}

export interface CategoryUsage {
  type: string
  total: number
  used: number
  unused: number
  percent: number
  tokens: TokenUse[]
}

export interface UsageSnapshot {
  report: CategoryUsage[]
  scannedCount: number
  mode: 'heuristic' | 'precise'
}

type ReportShape = Pick<UsageReport, 'facts' | 'views'>

/** Collapses a report into per-category rows. Drops per-file data, so size tracks tokens, not sources. */
export function summarizeTokenUsage(report: ReportShape): CategoryUsage[] {
  const byCategory = new Map<string, string[]>()

  for (const token of report.facts?.tokens ?? []) {
    const name = token.path.startsWith(`${token.category}.`) ? token.path.slice(token.category.length + 1) : token.path
    const list = byCategory.get(token.category) ?? []
    list.push(name)
    byCategory.set(token.category, list)
  }

  return (report.views?.tokens?.categories ?? []).map((category) => {
    const used = new Set((category.top ?? []).filter((token) => token.uses > 0).map((token) => token.name))
    const unused = (byCategory.get(category.category) ?? []).filter((name) => !used.has(name))

    return {
      type: category.category,
      total: category.total,
      used: category.used,
      unused: category.unused,
      percent: category.percentUsed,
      tokens: [
        ...(category.top ?? []).map((token) => ({ name: token.name, uses: token.uses })),
        ...unused.map((name) => ({ name, uses: 0 })),
      ],
    }
  })
}
