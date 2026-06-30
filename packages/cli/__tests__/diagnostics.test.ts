import { describe, expect, it } from 'vitest'
import { configLoadDiagnostics } from '../src/diagnostics'

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
})
