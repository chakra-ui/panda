import {
  createUsageReport,
  diagnosticsPass,
  type Diagnostic,
  type NamedUsageReport,
  type RecipeUsageItem,
  type TokenCategoryUsage,
  type UsageReport,
} from '@pandacss/compiler-shared'
import { defineCommand } from 'citty'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { baseArgs, includeArgs, normalizeInclude, outputArgs, parseCliFlags, traceArgs } from '../args'
import { normalizeCliDiagnostics } from '../diagnostics'
import { consoleOutput, renderCommandDiagnostics, shouldPrintHumanSummary, type OutputSink } from '../output'
import { setExitCode } from '../result'
import type { AnalyzeFlags, AnalyzeResult, AnalyzeScope } from '../schema'
import { analyzeFlagsSchema } from '../schema'
import { time } from '../timing'
import { runCommand, type CommandRunContext } from '../run-command'

export const analyzeCommand = defineCommand({
  meta: {
    name: 'analyze',
    description: 'Inspect Panda usage across project sources',
  },
  args: () => ({
    ...baseArgs(),
    ...includeArgs(),
    scope: {
      type: 'string',
      description: 'Print one section: tokens, recipes, utilities, patterns, or keyframes (token/recipe are aliases)',
    },
    limit: { type: 'string', description: 'Maximum rows to show per terminal report section' },
    unused: { type: 'boolean', description: 'List only the configured names no scanned file uses, one per line' },
    outfile: { type: 'string', description: 'Output path for a JSON report' },
    ...outputArgs(),
    ...traceArgs(),
  }),
  run: async ({ args }) => setExitCode(await runAnalyze(parseCliFlags(analyzeFlagsSchema, args))),
})

export async function runAnalyze(flags: AnalyzeFlags = {}, output: OutputSink = consoleOutput): Promise<AnalyzeResult> {
  return (await runCommand({
    command: 'analyze',
    flags,
    output,
    failData: () => ({ ...createUsageReport({ sourceCount: 0, files: [] }), outfile: undefined }),
    async execute(ctx) {
      const current = analyzeOnce(ctx, normalizeScope(flags.scope))
      const { report } = current

      if (flags.outfile) {
        mkdirSync(dirname(flags.outfile), { recursive: true })
        writeFileSync(flags.outfile, JSON.stringify(report, null, 2))
      }

      return {
        data: { ...report, outfile: flags.outfile },
        diagnostics: current.diagnostics,
        ok: current.ok,
      }
    },
    renderHuman(ctx, result) {
      renderCommandDiagnostics(result.diagnostics, ctx.output, flags, ctx.cwd)

      if (shouldPrintHumanSummary(flags)) {
        for (const line of renderAnalyzeSummary(result, flags)) {
          ctx.output.log(line)
        }

        if (flags.outfile) {
          ctx.output.log(`analyze: wrote report to ${flags.outfile}`)
        }
      }
    },
  })) as AnalyzeResult
}

interface AnalyzeOnceResult {
  report: UsageReport
  diagnostics: Diagnostic[]
  ok: boolean
}

function analyzeOnce(ctx: CommandRunContext<AnalyzeFlags>, scope: AnalyzeScope | 'all'): AnalyzeOnceResult {
  const scan = time({
    timings: ctx.timings,
    phase: 'scan',
    run: () => ctx.driver.scan({ include: normalizeInclude(ctx.flags.include) }),
  })
  const sources = scan.sort()

  const fileInputs: Array<{ path: string; source: string }> = []
  const fileDiagnostics: Diagnostic[] = []
  const sourceByPath = new Map<string, string>()

  for (const source of sources) {
    try {
      const contents = readFileSync(source, 'utf8')
      fileInputs.push({ path: source, source: contents })
      sourceByPath.set(source, contents)
    } catch (error) {
      fileDiagnostics.push(
        ...normalizeCliDiagnostics(
          [
            {
              code: 'analyze_file_read_error',
              severity: 'error',
              message: error instanceof Error ? error.message : String(error),
              category: 'analyze',
            },
          ],
          { cwd: ctx.cwd, file: source },
        ),
      )
    }
  }

  const inspection = time({
    timings: ctx.timings,
    phase: 'inspect',
    run: () => ctx.driver.compiler.inspectFiles(fileInputs),
  })
  const report = createUsageReport(inspection, {
    scope,
    spec: ctx.driver.compiler.spec(),
    sourceByPath,
    suggestTokens: (prop, value) => ctx.driver.compiler.suggestTokens(prop, value),
  })
  const inspectionDiagnostics = inspection.files.flatMap((file) => file.diagnostics)
  const diagnostics = normalizeCliDiagnostics(
    [...fileDiagnostics, ...inspectionDiagnostics, ...ctx.driver.compiler.diagnostics()],
    { cwd: ctx.cwd },
  )

  return {
    report,
    diagnostics,
    ok: diagnosticsPass(diagnostics, { maxWarnings: ctx.flags.maxWarnings }),
  }
}

function normalizeScope(scope: AnalyzeFlags['scope']): AnalyzeScope | 'all' {
  if (scope === 'token') return 'tokens'
  if (scope === 'recipe') return 'recipes'
  return scope ?? 'all'
}

// No `--scope` prints the summary and every section; one scope prints that section.
function renderAnalyzeSummary(result: AnalyzeResult, flags: AnalyzeFlags): string[] {
  const scope = normalizeScope(flags.scope)
  if (flags.unused) return renderUnused(result, scope)

  const limit = parseLimit(flags.limit)
  const lines = [`analyze: scanned ${result.sourceCount} files`]

  const show = (section: AnalyzeScope) => scope === section || scope === 'all'

  if (scope === 'all') {
    lines.push('', 'Summary', ...renderScopeSummary(result))
  }

  if (show('tokens')) {
    lines.push('', ...renderTokenReport(result.views?.tokens.categories ?? [], limit))
  }

  if (show('recipes')) {
    lines.push('', ...renderRecipeReport(result.views?.recipes.recipes ?? [], limit))
  }

  const named: Array<['utilities' | 'patterns' | 'keyframes', string, string]> = [
    ['utilities', 'Utilities', 'Utility'],
    ['patterns', 'Patterns', 'Pattern'],
    ['keyframes', 'Keyframes', 'Keyframe'],
  ]
  for (const [section, title, singular] of named) {
    if (show(section)) {
      lines.push('', ...renderNamedReport(title, singular, result.views?.[section], limit))
    }
  }

  return lines.filter((line, index, all) => !(line === '' && all[index - 1] === ''))
}

function renderScopeSummary(result: AnalyzeResult): string[] {
  const { summary } = result
  return [
    `tokens      ${summary.tokens.used} uses, ${summary.tokens.unique} unique`,
    `recipes     ${summary.recipes.used} uses, ${summary.recipes.unique} unique`,
    `utilities   ${summary.utilities.used} uses, ${summary.utilities.unique} unique`,
    `patterns    ${summary.patterns.used} uses, ${summary.patterns.unique} unique`,
    `keyframes   ${summary.keyframes.used} uses, ${summary.keyframes.unique} unique`,
  ]
}

function renderTokenReport(categories: TokenCategoryUsage[], limit: number): string[] {
  if (categories.length === 0) return ['No tokens found']

  const rows = categories.slice(0, limit).map((entry) => [
    entry.category,
    `${entry.used}/${entry.total} (${formatPercent(entry.percentUsed)})`,
    entry.top
      .slice(0, 3)
      .map((item) => `${item.name} (${item.uses})`)
      .join(', ') || '-',
    String(entry.rawValues.reduce((total, item) => total + item.uses, 0)),
    String(entry.files),
  ])

  return ['Tokens', ...renderTable(['Category', 'Used', 'Top tokens', 'Raw values', 'Files'], rows)]
}

function renderRecipeReport(recipes: RecipeUsageItem[], limit: number): string[] {
  if (recipes.length === 0) return ['No config recipes found']

  const rows = recipes.slice(0, limit).map((entry) => [
    entry.name,
    `${entry.usedVariantValues}/${entry.totalVariantValues} (${formatPercent(entry.percentUsed)})`,
    entry.top
      .slice(0, 3)
      .map((item) => `${item.name} (${item.uses})`)
      .join(', ') || '-',
    String(entry.files),
    formatUsedAs(entry.usedAs),
  ])

  return ['Recipes', ...renderTable(['Recipe', 'Variants', 'Top variants', 'Files', 'Used as'], rows)]
}

// One name per line so the list pipes and diffs. A single scope drops the
// headings entirely; the whole output is then the names.
function renderUnused(result: AnalyzeResult, scope: AnalyzeScope | 'all'): string[] {
  const views = result.views
  if (!views) return ['No configured theme to compare against']

  const sections: Array<[AnalyzeScope, string, string[]]> = [
    ['tokens', 'Tokens', views.tokens.unused],
    ['recipes', 'Recipes', views.recipes.unused],
    ['utilities', 'Utilities', views.utilities.unused],
    ['patterns', 'Patterns', views.patterns.unused],
    ['keyframes', 'Keyframes', views.keyframes.unused],
  ]

  if (scope !== 'all') {
    return sections.find(([section]) => section === scope)?.[2] ?? []
  }

  const lines = [`analyze: scanned ${result.sourceCount} files`, 'Unused in scanned sources']
  for (const [, title, names] of sections) {
    lines.push('', `${title} (${names.length})`, ...names)
  }
  return lines
}

function renderNamedReport(
  title: string,
  singular: string,
  view: NamedUsageReport | undefined,
  limit: number,
): string[] {
  if (!view || (view.items.length === 0 && view.total === 0)) return [`No ${title.toLowerCase()} found`]

  const heading =
    view.total > 0 ? `${title}   ${view.used}/${view.total} used (${formatPercent(view.percentUsed)})` : title
  const lines = [heading]

  if (view.items.length === 0) {
    lines.push(`No ${title.toLowerCase()} used in scanned sources`)
  } else {
    const rows = view.items.slice(0, limit).map((item) => [item.name, String(item.uses), String(item.files)])
    lines.push(...renderTable([singular, 'Uses', 'Files'], rows))
  }

  if (view.unused.length > 0) {
    const shown = view.unused.slice(0, limit)
    const more = view.unused.length - shown.length
    const names = more > 0 ? [...shown, `+${more} more`] : shown
    lines.push(...wrapList(`Unused in scanned sources (${view.unused.length}): `, names))
  }

  return lines
}

function wrapList(prefix: string, names: string[], width = 100): string[] {
  const lines: string[] = []
  let current = prefix

  for (const [index, name] of names.entries()) {
    const piece = index === names.length - 1 ? name : `${name}, `
    if (current.length + piece.length > width && current !== prefix) {
      lines.push(current.trimEnd())
      current = `  ${piece}`
    } else {
      current += piece
    }
  }

  lines.push(current.trimEnd())
  return lines
}

function renderTable(headers: string[], rows: string[][]): string[] {
  const widths = headers.map((header, index) => Math.max(header.length, ...rows.map((row) => row[index]?.length ?? 0)))

  return [headers, ...rows].map((row) =>
    row
      .map((cell, index) => cell.padEnd(widths[index] ?? 0))
      .join('   ')
      .trimEnd(),
  )
}

function parseLimit(value: AnalyzeFlags['limit']): number {
  const limit = Number(value ?? 10)
  return Number.isInteger(limit) && limit > 0 ? limit : 10
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`
}

function formatUsedAs(usedAs: RecipeUsageItem['usedAs']): string {
  const total = usedAs.jsx + usedAs.fn
  if (total === 0) return 'jsx 0%, fn 0%'

  return `jsx ${Math.round((usedAs.jsx / total) * 100)}%, fn ${Math.round((usedAs.fn / total) * 100)}%`
}
