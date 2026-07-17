import { describe, expect, it } from 'vitest'
import { configLoadDiagnostics, formatDiagnostic } from '../src/diagnostics'
import { renderCommandDiagnostics } from '../src/output'

describe('diagnostics helpers', () => {
  it('preserves diagnostics attached to config load errors', () => {
    const error = new Error('failed') as Error & { diagnostics: unknown[] }
    error.diagnostics = [
      {
        code: 'design_system_in_include',
        severity: 'error',
        category: 'config',
        message: 'Move "@acme/ds" to designSystem.',
      },
      {
        code: 'design_system_in_include',
        severity: 'error',
        category: 'config',
        message: 'Move "@acme/theme" to designSystem.',
      },
    ]

    expect(configLoadDiagnostics(error, { cwd: '/repo' })).toEqual([
      {
        code: 'design_system_in_include',
        severity: 'error',
        category: 'config',
        message: 'Move "@acme/ds" to designSystem.',
      },
      {
        code: 'design_system_in_include',
        severity: 'error',
        category: 'config',
        message: 'Move "@acme/theme" to designSystem.',
      },
    ])
  })

  it('shows help in the default human format', () => {
    expect(
      formatDiagnostic({
        code: 'design_system_buildinfo_stale',
        severity: 'warning',
        message: 'Build info is stale.',
        help: ['Run `panda lib` in the design-system package.'],
      }),
    ).toMatchInlineSnapshot(`
      "warning design_system_buildinfo_stale Build info is stale.
        help: Run \`panda lib\` in the design-system package."
    `)
  })

  it('routes human diagnostics to stderr and respects severity log levels', () => {
    const stdout: string[] = []
    const stderr: string[] = []
    const diagnostics = [
      { code: 'info', severity: 'info' as const, message: 'info message' },
      { code: 'warning', severity: 'warning' as const, message: 'warning message' },
      { code: 'error', severity: 'error' as const, message: 'error message' },
    ]

    renderCommandDiagnostics(
      diagnostics,
      { log: (message) => stdout.push(message), error: (message) => stderr.push(message) },
      { logLevel: 'warn' },
      '/repo',
    )

    expect({ stdout, stderr }).toMatchInlineSnapshot(`
      {
        "stderr": [
          "warning warning warning message
      error error error message",
        ],
        "stdout": [],
      }
    `)
  })
})
