import { createUsageReport } from './inspection'
import type { Compiler, Diagnostic, UsageReport, UsageReportScopeOption } from './types'

export interface AnalyzeSourcesResult {
  report: UsageReport
  diagnostics: Diagnostic[]
}

/** Inspect fresh source contents without generating CSS or writing artifacts. */
export function analyzeSources(
  compiler: Compiler,
  paths: string[],
  scope: UsageReportScopeOption = 'all',
): AnalyzeSourcesResult {
  const files: Array<{ path: string; source: string }> = []
  const diagnostics: Diagnostic[] = []
  const sourceByPath = new Map<string, string>()

  for (const path of [...paths].sort()) {
    try {
      const source = compiler.fs.readFile(path)
      if (source == null) throw new Error('Could not read source file')

      files.push({ path, source })
      sourceByPath.set(path, source)
    } catch (error) {
      diagnostics.push({
        code: 'analyze_file_read_error',
        severity: 'error',
        message: error instanceof Error ? error.message : String(error),
        category: 'analyze',
        file: path,
      })
    }
  }

  const inspection = compiler.inspectFiles(files)
  const report = createUsageReport(inspection, {
    scope,
    spec: compiler.spec(),
    sourceByPath,
    suggestTokens: (prop, value) => compiler.suggestTokens(prop, value),
  })

  diagnostics.push(
    ...inspection.files.flatMap((file) =>
      file.diagnostics.map((diagnostic) => ({ ...diagnostic, file: diagnostic.file ?? file.path })),
    ),
    ...compiler.diagnostics(),
  )

  return { report, diagnostics }
}
