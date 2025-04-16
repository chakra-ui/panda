import { markdownTable } from 'markdown-table'
import { table } from 'table'
import Wordwrap from 'wordwrapjs'
import type { RecipeReportEntry } from './reporter-recipe'
import type { TokenReportEntry } from './reporter-token'

export type ReportFormat = 'json' | 'markdown' | 'csv' | 'text' | 'table'

const plural = (count: number, singular: string) => {
  const pr = new Intl.PluralRules('en-US').select(count)
  const plural = pr === 'one' || count === 0 ? singular : `${singular}s`
  return `${count} ${plural}`
}

const createWrapFn = (enabled: boolean) => (str: string) => (enabled ? Wordwrap.wrap(str, { width: 20 }) : str)

export function formatTokenReport(result: TokenReportEntry[], format: ReportFormat): string {
  const headers = ['Token', 'Usage %', 'Most used', 'Hardcoded', 'Found in']

  function getFormatted(entry: TokenReportEntry, wrap: boolean) {
    const wrapFn = createWrapFn(wrap)
    return [
      `${entry.category} (${plural(entry.count, 'token')})`,
      `${entry.percentUsed}% (${plural(entry.usedCount, 'token')})`,
      wrapFn(entry.mostUsedNames.join(', ')),
      entry.hardcoded.toString(),
      `${plural(entry.usedInXFiles, 'file')}`,
    ]
  }

  switch (format) {
    case 'json':
      return JSON.stringify(result, null, 2)

    case 'markdown': {
      return markdownTable([headers, ...result.map((entry) => getFormatted(entry, true))])
    }

    case 'csv': {
      return [headers.join(','), ...result.map((entry) => getFormatted(entry, false).join(','))].join('\n')
    }

    case 'table': {
      return table([headers, ...result.map((entry) => getFormatted(entry, true))])
    }

    case 'text':
    default: {
      const formatted = result.map((entry) => getFormatted(entry, false))
      return headers.map((header, index) => `${header}: ${formatted[index]}`).join('\n')
    }
  }
}

export function formatRecipeReport(result: RecipeReportEntry[], format: ReportFormat): string {
  function getFormatted(entry: RecipeReportEntry, wrap: boolean) {
    const wrapFn = createWrapFn(wrap)
    return [
      `${entry.recipeName} (${plural(entry.variantCount, 'variant')})`,
      `${plural(entry.possibleCombinations.length, 'value')}`,
      `${entry.percentUsed}% (${plural(entry.usedCombinations, 'value')})`,
      wrapFn(entry.mostUsedCombinations.join(', ')),
      `${plural(entry.usedInXFiles, 'file')}`,
      `jsx: ${entry.jsxPercentUsed}%\nfn: ${entry.fnPercentUsed}%`,
    ]
  }

  const headers = ['Recipe', 'Variant values', 'Usage %', 'Most used', 'Found in', 'Used as']

  switch (format) {
    case 'json': {
      return JSON.stringify(result, null, 2)
    }

    case 'markdown': {
      return table([headers, ...result.map((entry) => getFormatted(entry, true))])
    }

    case 'csv': {
      return [headers.join(','), ...result.map((entry) => getFormatted(entry, false).join(','))].join('\n')
    }

    case 'table': {
      return table([headers, ...result.map((entry) => getFormatted(entry, true))])
    }

    case 'text':
    default: {
      const formatted = result.map((entry) => getFormatted(entry, false))
      return headers.map((header, index) => `${header}: ${formatted[index]}`).join('\n')
    }
  }
}
