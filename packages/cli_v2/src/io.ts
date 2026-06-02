import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, resolve } from 'node:path'
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

export function resolveOutdir(cwd: string, outdir?: unknown): string {
  return typeof outdir === 'string' && outdir.length > 0 ? outdir : 'styled-system'
}

export function resolveFile(cwd: string, file: string): string {
  return isAbsolute(file) ? file : join(cwd, file)
}

export async function writeTextFile(path: string, code: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, code)
}

export function formatDiagnostics(diagnostics: Diagnostic[]): string {
  if (diagnostics.length === 0) return 'diagnostics: 0'
  return `diagnostics: ${diagnostics.length}`
}
