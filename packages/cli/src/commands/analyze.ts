import { createUsageReport, type RecipeUsageItem, type TokenCategoryUsage } from '@pandacss/compiler-shared'
import { defineCommand } from 'citty'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { renderAnalyzeHtml } from '../analyze-report'
import { baseArgs, includeArgs, normalizeInclude, outputArgs, parseCliFlags, traceArgs } from '../args'
import { diagnosticsPass, normalizeDiagnostics, type CliDiagnostic } from '../diagnostics'
import { consoleOutput, renderCommandDiagnostics, shouldPrintHumanSummary, type OutputSink } from '../output'
import { setExitCode } from '../result'
import type { AnalyzeFlags, AnalyzeResult, AnalyzeScope } from '../schema'
import { analyzeFlagsSchema } from '../schema'
import { time } from '../timing'

import { runCommand } from '../run-command'

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
      description:
        'Scope to include in the report: all, tokens, recipes, utilities, patterns, keyframes (token/recipe supported as aliases)',
    },
    limit: { type: 'string', description: 'Maximum rows to show per terminal report section' },
    outfile: { type: 'string', description: 'Output path for a JSON report' },
    report: { type: 'string', description: 'Output directory for a static HTML report' },
    ...outputArgs(),
    ...traceArgs(),
  }),
  run: async ({ args }) => setExitCode(await runAnalyze(parseCliFlags(analyzeFlagsSchema, args))),
})

export async function runAnalyze(flags: AnalyzeFlags = {}, output: OutputSink = consoleOutput): Promise<AnalyzeResult> {
  return runCommand({
    command: 'analyze',
    flags,
    output,
    failData: () => {
      const report = createUsageReport({ sourceCount: 0, files: [] })
      return {
        sourceCount: report.sourceCount,
        scope: report.scope,
        summary: report.summary,
        facts: report.facts,
        files: report.files,
        sourceUsages: report.sourceUsages,
        report: undefined,
      }
    },
    async execute({ driver, cwd, timings }) {
      const scope = normalizeScope(flags.scope)
      const scan = time({
        timings,
        phase: 'scan',
        run: () => driver.scan({ include: normalizeInclude(flags.include) }),
      })
      const sources = scan.sort()

      const fileInputs: Array<{ path: string; source: string }> = []
      const fileDiagnostics: CliDiagnostic[] = []

      for (const source of sources) {
        try {
          fileInputs.push({ path: source, source: readFileSync(source, 'utf8') })
        } catch (error) {
          fileDiagnostics.push(
            ...normalizeDiagnostics(
              [
                {
                  code: 'analyze_file_read_error',
                  severity: 'error',
                  message: error instanceof Error ? error.message : String(error),
                  category: 'analyze',
                },
              ],
              { cwd, file: source },
            ),
          )
        }
      }

      const inspection = time({ timings, phase: 'inspect', run: () => driver.compiler.inspectFiles(fileInputs) })
      const report = createUsageReport(inspection, {
        scope,
        spec: driver.compiler.spec(),
        suggestTokens: (prop, value) => driver.compiler.suggestTokens(prop, value),
      })

      if (flags.outfile) {
        mkdirSync(dirname(flags.outfile), { recursive: true })
        writeFileSync(flags.outfile, JSON.stringify(report, null, 2))
      }

      if (flags.report) {
        mkdirSync(flags.report, { recursive: true })
        writeFileSync(join(flags.report, 'data.json'), JSON.stringify(report, null, 2))
        writeFileSync(join(flags.report, 'index.html'), renderAnalyzeHtml(report))
      }

      const inspectionDiagnostics = inspection.files.flatMap((file) => file.diagnostics)
      const diagnostics = normalizeDiagnostics(
        [...fileDiagnostics, ...inspectionDiagnostics, ...driver.compiler.diagnostics()],
        { cwd },
      )

      return {
        data: {
          sourceCount: report.sourceCount,
          scope: report.scope,
          summary: report.summary,
          facts: report.facts,
          views: report.views,
          files: report.files,
          sourceUsages: report.sourceUsages,
          report: flags.report,
        },
        diagnostics,
        ok: diagnosticsPass(diagnostics, flags.maxWarnings),
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

        if (flags.report) {
          ctx.output.log(`analyze: wrote HTML report to ${flags.report}`)
        }
      }
    },
  }) as Promise<AnalyzeResult>
}

function normalizeScope(scope: AnalyzeFlags['scope']): AnalyzeScope {
  if (scope === 'token') return 'tokens'
  if (scope === 'recipe') return 'recipes'
  return scope ?? 'all'
}

function renderAnalyzeSummary(result: AnalyzeResult, flags: AnalyzeFlags): string[] {
  const scope = normalizeScope(flags.scope)
  const limit = parseLimit(flags.limit)
  const lines = [`analyze: scanned ${result.sourceCount} files`]

  if (scope === 'all') {
    lines.push('', 'Summary', ...renderScopeSummary(result))
  }

  if (scope === 'all' || scope === 'tokens') {
    lines.push('', ...renderTokenReport(result.views?.tokens.categories ?? [], limit))
  }

  if (scope === 'all' || scope === 'recipes') {
    lines.push('', ...renderRecipeReport(result.views?.recipes.recipes ?? [], limit))
  }

  if (scope !== 'all' && scope !== 'tokens' && scope !== 'recipes') {
    const summary = result.summary[scope]
    lines.push(`${scope}: ${summary.used} uses, ${summary.unique} unique`)
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
