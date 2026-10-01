import { describe, expect, it } from 'vitest'
import type { Diagnostic, ParseFileReport } from '../src'
import {
  collectParseDiagnostics,
  createDiagnosticLog,
  dedupeDiagnostics,
  diagnosticKey,
  diagnosticKeyWithoutFile,
  diagnosticsPass,
  normalizeDiagnostics,
} from '../src'

const warning: Diagnostic = {
  code: 'extract_warning',
  severity: 'warning',
  message: 'Unsupported value',
  category: 'extract',
}

describe('diagnostics', () => {
  it('builds stable keys from file, location and span', () => {
    const diagnostic: Diagnostic = {
      ...warning,
      file: 'src/app.tsx',
      location: {
        start: { line: 1, column: 2 },
        end: { line: 1, column: 8 },
      },
      span: { start: 10, end: 16 },
    }

    expect(diagnosticKeyWithoutFile(diagnostic)).toBe('extract_warning|Unsupported value|warning|1:2:1:8|10:16')
    expect(diagnosticKey(diagnostic)).toBe('src/app.tsx|extract_warning|Unsupported value|warning|1:2:1:8|10:16')
  })

  it('dedupes exact duplicates and prefers file-backed duplicates', () => {
    const diagnostics = dedupeDiagnostics([
      warning,
      { ...warning, file: 'src/app.tsx' },
      { ...warning, file: 'src/app.tsx' },
      { ...warning, file: 'src/other.tsx' },
    ])

    expect(diagnostics).toEqual([
      { ...warning, file: 'src/app.tsx' },
      { ...warning, file: 'src/other.tsx' },
    ])
  })

  it('normalizes diagnostic files before deduping', () => {
    const diagnostics = normalizeDiagnostics([warning, { ...warning, file: '/repo/src/app.tsx' }], {
      file: '/repo/src/app.tsx',
      normalizeFile: (file) => file.replace('/repo/', ''),
    })

    expect(diagnostics).toEqual([{ ...warning, file: 'src/app.tsx' }])
  })

  it('leaves diagnostic files unchanged without a normalizer', () => {
    expect(normalizeDiagnostics([{ ...warning, file: '/repo/src/app.tsx' }])).toEqual([
      { ...warning, file: '/repo/src/app.tsx' },
    ])
  })

  it('collects parse diagnostics with report paths', () => {
    const reports: ParseFileReport[] = [
      {
        path: '/repo/src/a.tsx',
        cssCalls: 0,
        cvaCalls: 0,
        svaCalls: 0,
        jsxUsages: 0,
        diagnostics: [warning],
      },
      {
        path: '/repo/src/b.tsx',
        cssCalls: 0,
        cvaCalls: 0,
        svaCalls: 0,
        jsxUsages: 0,
        diagnostics: [{ ...warning, message: 'Second warning' }],
      },
    ]

    expect(
      collectParseDiagnostics(reports, {
        normalizeFile: (file) => file.replace('/repo/', ''),
      }),
    ).toEqual([
      { ...warning, file: 'src/a.tsx' },
      { ...warning, message: 'Second warning', file: 'src/b.tsx' },
    ])
  })

  it('fails on errors and enforces max warnings', () => {
    expect(diagnosticsPass([{ ...warning, severity: 'error' }])).toBe(false)
    expect(diagnosticsPass([warning], { maxWarnings: 0 })).toBe(false)
    expect(diagnosticsPass([warning], { maxWarnings: '1' })).toBe(true)
    expect(diagnosticsPass([warning], { maxWarnings: '' })).toBe(true)
  })

  it('skips warnings a file edit already printed when the stylesheet build lists them again', () => {
    const messages: string[] = []
    const warn = (message: string) => messages.push(message)
    const warnDiagnostics = createDiagnosticLog()
    const fileWarning = { ...warning, file: 'src/app.tsx' }
    const stylesheetWarning = { ...warning, code: 'static_css_invalid' }

    warnDiagnostics(warn, [fileWarning], 'while parsing src/app.tsx')
    warnDiagnostics(warn, [fileWarning, stylesheetWarning], 'while compiling the stylesheet', { onlyNew: true })
    warnDiagnostics(warn, [fileWarning], 'while parsing src/app.tsx')

    expect(messages).toMatchInlineSnapshot(`
      [
        "panda: 1 diagnostic(s) while parsing src/app.tsx
      warning extract_warning src/app.tsx Unsupported value",
        "panda: 1 diagnostic(s) while compiling the stylesheet
      warning static_css_invalid Unsupported value",
        "panda: 1 diagnostic(s) while parsing src/app.tsx
      warning extract_warning src/app.tsx Unsupported value",
      ]
    `)
  })
})
