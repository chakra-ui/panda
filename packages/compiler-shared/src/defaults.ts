import type { SerializedConfig } from './types'

export const defaultConfig = {
  outdir: 'styled-system',
  jsxFactory: 'styled',
  separator: '_',
  validation: 'warn',
} as const

export function applyConfigDefaults<T extends Record<string, any>>(config: T, cwd?: string) {
  return {
    ...config,
    cwd: stringOr(config.cwd, cwd ?? ''),
    outdir: stringOr(config.outdir, defaultConfig.outdir),
    jsxFactory: stringOr(config.jsxFactory, defaultConfig.jsxFactory),
    separator: stringOr(config.separator, defaultConfig.separator),
    validation: stringOr(config.validation, defaultConfig.validation),
  }
}

export function getResolvedConfigOutdir(config: SerializedConfig): string {
  const outdir = config.outdir
  if (typeof outdir === 'string' && outdir.length > 0) return outdir
  throw new Error('Expected resolved Panda config to include `outdir`.')
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback
}
