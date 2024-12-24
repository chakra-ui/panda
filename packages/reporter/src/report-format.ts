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

export function formatTokenReport(result: TokenReportEntry[], format: ReportFormat): string {
  switch (format) {
    case 'json':
      return JSON.stringify(result, null, 2)

    case 'markdown': {
      return markdownTable([
        ['Token', 'Usage %', 'Most Used', 'Unused %', 'Hardcoded', 'Found in'],
        ...result.map((entry) => [
          `${entry.category} (${entry.count} tokens)`,
          `${entry.percentUsed}% (${entry.usedCount} tokens)`,
          entry.mostUsedNames.join(', '),
          `${(100 - entry.percentUsed).toFixed(2)}%`,
          entry.hardcoded.toString(),
          plural(entry.usedInXFiles, 'file'),
        ]),
      ])
    }

    case 'csv': {
      return [
        'Token,Usage %,Most Used,Unused %,Hardcoded,Found in',
        ...result.map((entry) =>
          [
            `${entry.category} (${entry.count} tokens)`,
            `${entry.percentUsed}% (${entry.usedCount} tokens)`,
            entry.mostUsedNames.join(', '),
            `${(100 - entry.percentUsed).toFixed(2)}%`,
            entry.hardcoded.toString(),
            plural(entry.usedInXFiles, 'file'),
          ].join(','),
        ),
      ].join('\n')
    }

    case 'table': {
      return table([
        ['Token', 'Usage %', 'Most Used', 'Unused %', 'Hardcoded', 'Found in'],
        ...result.map((entry) => [
          `${entry.category} (${entry.count} tokens)`,
          `${entry.percentUsed}% (${entry.usedCount} tokens)`,
          Wordwrap.wrap(entry.mostUsedNames.join(', '), { width: 20 }),
          `${(100 - entry.percentUsed).toFixed(2)}%`,
          entry.hardcoded,
          plural(entry.usedInXFiles, 'file'),
        ]),
      ])
    }

    case 'text':
    default:
      return result
        .map((entry) =>
          [
            `Token: ${entry.category} (${entry.count} tokens)`,
            `Usage: ${entry.percentUsed}% (${entry.usedCount} tokens)`,
            `Most Used: ${entry.mostUsedNames}`,
            `Unused: ${(100 - entry.percentUsed).toFixed(2)}%`,
            `Hardcoded: ${entry.hardcoded}`,
            `Found in: ${plural(entry.usedInXFiles, 'file')}`,
            '',
          ].join('\n'),
        )
        .join('\n')
  }
}

export function formatRecipeReport(result: RecipeReportEntry[], format: ReportFormat): string {
  switch (format) {
    case 'json': {
      return JSON.stringify(result, null, 2)
    }

    case 'markdown': {
      return table([
        ['Recipe', 'Variant Combinations', 'Usage %', 'JSX %', 'Function %', 'Unused', 'Most Used', 'Found in'],
        ...result.map((entry) => [
          `${entry.recipeName} (${entry.variantCount} variants)`,
          `${entry.usedCombinations} / ${entry.possibleCombinations.length}`,
          `${entry.percentUsed}%`,
          `${entry.jsxPercentUsed}%`,
          `${entry.fnPercentUsed}%`,
          entry.unusedCombinations,
          entry.mostUsedCombinations,
          plural(entry.usedInXFiles, 'file'),
        ]),
      ])
    }

    case 'csv': {
      return [
        'Recipe,Variant Combinations,Usage %,JSX %,Function %,Unused,Most Used,Found in',
        ...result.map((entry) =>
          [
            `"${entry.recipeName} (${entry.variantCount} variants)"`,
            `${entry.usedCombinations} / ${entry.possibleCombinations.length}`,
            `${entry.percentUsed}%`,
            `${entry.jsxPercentUsed}%`,
            `${entry.fnPercentUsed}%`,
            `"${entry.unusedCombinations}"`,
            `"${entry.mostUsedCombinations}"`,
            `"${plural(entry.usedInXFiles, 'file')}"`,
          ].join(','),
        ),
      ].join('\n')
    }

    case 'table': {
      return table([
        ['Recipe', 'Variant Combinations', 'Usage %', 'JSX %', 'Function %', 'Unused', 'Most Used', 'Found in'],
        ...result.map((entry) => [
          `${entry.recipeName} (${entry.variantCount} variants)`,
          `${entry.usedCombinations} / ${entry.possibleCombinations.length}`,
          `${entry.percentUsed}%`,
          `${entry.jsxPercentUsed}%`,
          `${entry.fnPercentUsed}%`,
          entry.unusedCombinations,
          Wordwrap.wrap(entry.mostUsedCombinations.join(', '), { width: 20 }),
          plural(entry.usedInXFiles, 'file'),
        ]),
      ])
    }

    case 'text':
    default: {
      return result
        .map((entry) =>
          [
            `Recipe: ${entry.recipeName} (${entry.variantCount} variants)`,
            `Variant Combinations: ${entry.usedCombinations} / ${entry.possibleCombinations.length}`,
            `Usage: ${entry.percentUsed}%`,
            `JSX Usage: ${entry.jsxPercentUsed}%`,
            `Function Usage: ${entry.fnPercentUsed}%`,
            `Unused: ${entry.unusedCombinations}`,
            `Most Used: ${entry.mostUsedCombinations}`,
            `Found in: ${plural(entry.usedInXFiles, 'file')}`,
            '',
          ].join('\n'),
        )
        .join('\n')
    }
  }
}
