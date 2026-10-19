import type { FileInspectionResult } from '@pandacss/compiler'
import { Linter } from 'eslint'
import { expect, test } from 'vitest'
import { createExtractionDiagnosticsRule } from '../src'

test('reports a diagnostic without a location at the top of the file', () => {
  const rule = createExtractionDiagnosticsRule({
    inspect: (): FileInspectionResult => ({
      path: 'file.ts',
      diagnostics: [{ code: 'file_level', message: 'file-level diagnostic', severity: 'warning' }],
      usages: [],
      calls: [],
      jsx: [],
      tokenRefs: [],
      componentEntries: [],
      styleEntries: [],
    }),
  })

  const messages = new Linter().verify('const a = 1\n', {
    plugins: { panda: { rules: { 'extraction-diagnostics': rule } } },
    rules: { 'panda/extraction-diagnostics': 'error' },
  })

  expect(messages).toMatchObject([{ message: 'file-level diagnostic', line: 1, column: 1 }])
})
