import { createUsageReport, diagnosticsPass, type Diagnostic } from '@pandacss/compiler-shared'
import { defineCommand } from 'citty'
import { readFileSync } from 'node:fs'
import { baseArgs, includeArgs, normalizeInclude, outputArgs, parseCliFlags, traceArgs } from '../args'
import { normalizeCliDiagnostics } from '../diagnostics'
import { consoleOutput, renderCommandDiagnostics, shouldPrintHumanSummary, type OutputSink } from '../output'
import { setExitCode } from '../result'
import type { AnalyzeFlags, AnalyzeResult } from '../schema'
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
    failData: () => ({ ...createUsageReport({ sourceCount: 0, files: [] }) }),
    async execute(ctx) {
      const current = analyzeOnce(ctx)
      return {
        data: { ...current.report },
        diagnostics: current.diagnostics,
        ok: current.ok,
      }
    },
    renderHuman(ctx, result) {
      renderCommandDiagnostics(result.diagnostics, ctx.output, flags, ctx.cwd)

      if (shouldPrintHumanSummary(flags)) {
        for (const line of renderAnalyzeSummary(result)) {
          ctx.output.log(line)
        }
      }
    },
  })) as AnalyzeResult
}

interface AnalyzeOnceResult {
  report: ReturnType<typeof createUsageReport>
  diagnostics: Diagnostic[]
  ok: boolean
}

function analyzeOnce(ctx: CommandRunContext<AnalyzeFlags>): AnalyzeOnceResult {
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

function renderAnalyzeSummary(result: AnalyzeResult): string[] {
  const { summary } = result
  return [
    `analyze: scanned ${result.sourceCount} files`,
    '',
    'Summary',
    `tokens      ${summary.tokens.used} uses, ${summary.tokens.unique} unique`,
    `recipes     ${summary.recipes.used} uses, ${summary.recipes.unique} unique`,
    `utilities   ${summary.utilities.used} uses, ${summary.utilities.unique} unique`,
    `patterns    ${summary.patterns.used} uses, ${summary.patterns.unique} unique`,
    `keyframes   ${summary.keyframes.used} uses, ${summary.keyframes.unique} unique`,
  ]
}
