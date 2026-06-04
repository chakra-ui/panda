import { resolve } from 'node:path'
import type { Diagnostic } from '@pandacss/compiler'

export interface OutputSink {
  log(message: string): void
  error?(message: string): void
}

export const consoleOutput: OutputSink = {
  log: (message) => console.log(message),
  error: (message) => console.error(message),
}

export function resolveCwd(cwd?: string): string {
  return resolve(cwd ?? process.cwd())
}

export function formatDiagnostics(diagnostics: Diagnostic[]): string {
  if (diagnostics.length === 0) return 'diagnostics: 0'
  return `diagnostics: ${diagnostics.length}`
}
