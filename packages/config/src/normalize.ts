import type { UserConfig } from '@pandacss/types'

const CLASS_NAME_OPTION_KEYS = ['hash', 'prefix', 'separator'] as const

export type ClassNameOptionKey = (typeof CLASS_NAME_OPTION_KEYS)[number]

export interface NormalizedClassNameOptions {
  hash: { cssVar: boolean; className: boolean }
  prefix: { cssVar: string; className: string }
  separator: string
}

export function normalizeClassNameOptions(config: UserConfig): NormalizedClassNameOptions {
  return {
    hash: normalizeHash(config.hash),
    prefix: normalizePrefix(config.prefix),
    separator: config.separator ?? '_',
  }
}

export function diffClassNameOptions(
  consumer: UserConfig,
  designSystem: NormalizedClassNameOptions,
  scope: 'explicit' | 'effective',
): ClassNameOptionKey[] {
  const normalized = normalizeClassNameOptions(consumer)

  return CLASS_NAME_OPTION_KEYS.filter((key) => {
    if (scope === 'explicit' && consumer[key] === undefined) {
      return false
    }

    if (key === 'separator') {
      return normalized.separator !== designSystem.separator
    }

    return (
      normalized[key].cssVar !== designSystem[key].cssVar || normalized[key].className !== designSystem[key].className
    )
  })
}

function normalizeHash(value: UserConfig['hash']): NormalizedClassNameOptions['hash'] {
  if (typeof value === 'boolean') {
    return { cssVar: value, className: value }
  }

  if (value && typeof value === 'object') {
    return { cssVar: value.cssVar === true, className: value.className === true }
  }

  return { cssVar: false, className: false }
}

function normalizePrefix(value: UserConfig['prefix']): NormalizedClassNameOptions['prefix'] {
  if (typeof value === 'string') {
    return { cssVar: value, className: value }
  }

  if (value && typeof value === 'object') {
    return { cssVar: value.cssVar ?? '', className: value.className ?? '' }
  }

  return { cssVar: '', className: '' }
}
