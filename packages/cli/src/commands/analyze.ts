import {
  createUsageReport,
  type RecipeUsageItem,
  type TokenCategoryUsage,
  type UsageReport,
} from '@pandacss/compiler-shared'
import { defineCommand } from 'citty'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { renderAnalyzeHtml } from '../analyze-report'
import { startAnalyzeUiServer } from '../analyze-ui-server'
import { baseArgs, includeArgs, normalizeInclude, outputArgs, parseCliFlags, traceArgs } from '../args'
import { diagnosticsPass, normalizeDiagnostics, type CliDiagnostic } from '../diagnostics'
import { consoleOutput, renderCommandDiagnostics, shouldPrintHumanSummary, type OutputSink } from '../output'
import { setExitCode } from '../result'
import type { AnalyzeFlags, AnalyzeResult, AnalyzeScope } from '../schema'
import { analyzeFlagsSchema } from '../schema'
import { parseMilliseconds, time } from '../timing'
import { formatWatchError, startProjectWatch, type WatchEvent } from '../watch'
import { createWatchLogger } from '../watch-logger'

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
      description:
        'Scope to include in the report: all, tokens, recipes, utilities, patterns, keyframes (token/recipe supported as aliases)',
    },
    limit: { type: 'string', description: 'Maximum rows to show per terminal report section' },
    outfile: { type: 'string', description: 'Output path for a JSON report' },
    report: { type: 'string', description: 'Output directory for a static HTML report' },
    ui: { type: 'boolean', description: 'Start an interactive analyze report UI' },
    'ui-host': { type: 'string', description: 'Host for the analyze UI server' },
    'ui-port': { type: 'string', description: 'Port for the analyze UI server' },
    'watch-debounce': { type: 'string', description: 'UI refresh debounce in milliseconds' },
    ...outputArgs(),
    ...traceArgs(),
  }),
  run: async ({ args }) => setExitCode(await runAnalyze(parseCliFlags(analyzeFlagsSchema, args))),
})

export async function runAnalyze(flags: AnalyzeFlags = {}, output: OutputSink = consoleOutput): Promise<AnalyzeResult> {
  let runCtx: CommandRunContext<AnalyzeFlags> | undefined
  let sourceFingerprints = new Map<string, string>()

  const result = (await runCommand({
    command: 'analyze',
    flags,
    output,
    keepTracing: !!flags.ui,
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
        ui: undefined,
      }
    },
    async execute(ctx) {
      const scope = normalizeScope(flags.scope)
      runCtx = ctx
      const current = analyzeOnce(ctx, scope)
      sourceFingerprints = current.fingerprints
      const { report } = current

      if (flags.outfile) {
        mkdirSync(dirname(flags.outfile), { recursive: true })
        writeFileSync(flags.outfile, JSON.stringify(report, null, 2))
      }

      if (flags.report) {
        mkdirSync(flags.report, { recursive: true })
        writeFileSync(join(flags.report, 'data.json'), JSON.stringify(report, null, 2))
        writeFileSync(join(flags.report, 'index.html'), renderAnalyzeHtml(report))
      }

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
          ui: undefined,
        },
        diagnostics: current.diagnostics,
        ok: current.ok,
      }
    },
    renderHuman(ctx, result) {
      renderCommandDiagnostics(result.diagnostics, ctx.output, flags, ctx.cwd)

      if (flags.ui) return

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
  })) as AnalyzeResult

  if (flags.ui && runCtx && result.driver) {
    const watchLogger = createWatchLogger(runCtx.output)
    const server = await startAnalyzeUiServer({
      host: flags.uiHost,
      port: flags.uiPort,
      report: result,
    })
    result.ui = server.url
    watchLogger.log(`analyze: UI running at ${server.url}`)

    const refresh = async (reason: string) => {
      const startedAt = performance.now()
      const current = analyzeOnce(runCtx!, normalizeScope(flags.scope))
      sourceFingerprints = current.fingerprints
      Object.assign(result, current.report, {
        diagnostics: current.diagnostics,
        ok: current.ok,
      })
      server.update(current.report)
      renderCommandDiagnostics(current.diagnostics, runCtx!.output, flags, runCtx!.cwd)
      watchLogger.log(`analyze: refreshed ${reason} in ${Math.round(performance.now() - startedAt)}ms`, {
        dedupeKey: `refresh:${reason}`,
      })
    }

    const stopWatch = await startProjectWatch({
      driver: result.driver,
      cwd: runCtx.cwd,
      outdir: '.panda/analyze-ui',
      debounceMs: parseMilliseconds(flags.watchDebounce),
      onError: (error) => watchLogger.error(`panda: failed to refresh analyze UI\n${formatWatchError(error)}`),
      onSourceChange: async (events) => {
        if (!hasSourceContentChange(runCtx!.cwd, sourceFingerprints, events)) return

        const reason = formatAnalyzeUiChange(runCtx!.cwd, 'source', events)
        watchLogger.log(`analyze: ${reason}`, { dedupeKey: `change:${reason}` })
        result.driver!.applyChanges(events)
        await refresh(reason)
      },
      onConfigChange: async (events) => {
        const reason = formatAnalyzeUiChange(runCtx!.cwd, 'config', events)
        watchLogger.log(`analyze: ${reason}`, { dedupeKey: `change:${reason}` })
        const diff = await result.driver!.reload()
        if (diff.hasChanged) {
          await refresh(reason)
        } else {
          watchLogger.log('analyze: config unchanged')
        }
      },
    })
    watchLogger.log('analyze: watching for changes')

    const stopTracing = result.stop
    result.stop = async () => {
      await stopWatch()
      await server.close()
      await stopTracing?.()
    }
  }

  return result
}

interface AnalyzeOnceResult {
  report: UsageReport
  diagnostics: CliDiagnostic[]
  fingerprints: Map<string, string>
  ok: boolean
}

function analyzeOnce(ctx: CommandRunContext<AnalyzeFlags>, scope: AnalyzeScope): AnalyzeOnceResult {
  const scan = time({
    timings: ctx.timings,
    phase: 'scan',
    run: () => ctx.driver.scan({ include: normalizeInclude(ctx.flags.include) }),
  })
  const sources = scan.sort()

  const fileInputs: Array<{ path: string; source: string }> = []
  const fileDiagnostics: CliDiagnostic[] = []
  const fingerprints = new Map<string, string>()
  const sourceByPath = new Map<string, string>()

  for (const source of sources) {
    try {
      const contents = readFileSync(source, 'utf8')
      fileInputs.push({ path: source, source: contents })
      sourceByPath.set(source, contents)
      fingerprints.set(normalizeWatchPath(ctx.cwd, source), hashSource(contents))
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
  const diagnostics = normalizeDiagnostics(
    [...fileDiagnostics, ...inspectionDiagnostics, ...ctx.driver.compiler.diagnostics()],
    { cwd: ctx.cwd },
  )

  return {
    report,
    diagnostics,
    fingerprints,
    ok: diagnosticsPass(diagnostics, ctx.flags.maxWarnings),
  }
}

function normalizeScope(scope: AnalyzeFlags['scope']): AnalyzeScope {
  if (scope === 'token') return 'tokens'
  if (scope === 'recipe') return 'recipes'
  return scope ?? 'all'
}

function formatAnalyzeUiChange(cwd: string, kind: 'source' | 'config', events: WatchEvent[]): string {
  if (events.length === 1) return `${kind} changed ${formatEventPath(cwd, events[0]!.path)}`

  return `${events.length} ${kind} files changed`
}

function formatEventPath(cwd: string, path: string): string {
  const relativePath = relative(cwd, normalizeWatchPath(cwd, path))
  return relativePath && !relativePath.startsWith('..') ? relativePath : path
}

function hasSourceContentChange(cwd: string, fingerprints: Map<string, string>, events: WatchEvent[]): boolean {
  return events.some((event) => {
    const path = normalizeWatchPath(cwd, event.path)

    if (event.kind === 'unlink') return fingerprints.has(path)

    try {
      return fingerprints.get(path) !== hashSource(readFileSync(path, 'utf8'))
    } catch {
      return true
    }
  })
}

function normalizeWatchPath(cwd: string, path: string): string {
  return isAbsolute(path) ? path : resolve(cwd, path)
}

function hashSource(source: string): string {
  return createHash('sha1').update(source).digest('hex')
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
