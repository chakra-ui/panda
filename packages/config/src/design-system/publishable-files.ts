import { relative, resolve } from 'node:path'
import { toPosixPath } from '../paths'

export interface FilterPublishableLibFilesOptions {
  /** Fallback paths relative to the lib outdir (same form as manifest `files`). */
  files: string[]
  packageRoot: string
  /** Lib outdir — resolve `files` entries from here. */
  outRoot: string
  /** package.json `"files"`; omit when the whole package is packed. */
  publishFiles?: string[]
}

export interface FilterPublishableLibFilesResult {
  files: string[]
  unpublished: string[]
}

type PackageFilesRule =
  | { kind: 'prefix'; negated: boolean; value: string }
  | { kind: 'regex'; negated: boolean; value: RegExp }

const GLOB_START = /[*?{]/
const HAS_WILDCARD = /[*?]/
const TRAILING_SLASH = /\/$/
const REGEX_META = /[.+^${}()|[\]\\]/g
const GLOBSTAR = /\*\*/g
const GLOB_STAR = /\*/g
const GLOB_QMARK = /\?/g
const GLOBSTAR_TOKEN = /<<<DS>>>/g

/**
 * Drop inferred lib fallback paths that would not ship in the npm tarball when
 * package.json `"files"` is set. Explicit `--files` should skip this filter.
 *
 * Runs once at `panda lib` time (not on consume/cssgen). Patterns are compiled
 * once per call; the common `"files": ["dist"]` case is prefix-only.
 */
export function filterPublishableLibFiles(options: FilterPublishableLibFilesOptions): FilterPublishableLibFilesResult {
  const { files, packageRoot, outRoot, publishFiles } = options
  if (!publishFiles?.length) {
    return { files, unpublished: [] }
  }

  const rules = compilePackageFilesRules(publishFiles)
  const kept: string[] = []
  const unpublished: string[] = []

  for (const file of files) {
    const packageRelative = libFileToPackageRelative(file, packageRoot, outRoot)
    if (packageRelative !== undefined && matchesCompiledRules(packageRelative, rules)) {
      kept.push(file)
    } else {
      unpublished.push(file)
    }
  }

  return { files: kept, unpublished }
}

/** Read package.json `"files"` when it is a non-empty string array. */
export function readPublishFilesField(value: unknown): string[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined
  for (const entry of value) {
    if (typeof entry !== 'string') return undefined
  }
  return value as string[]
}

/** Resolve a manifest `files` entry to a package-root-relative path (or glob root). */
function libFileToPackageRelative(file: string, packageRoot: string, outRoot: string): string | undefined {
  const normalized = toPosixPath(file)
  const withoutDot = normalized.startsWith('./') ? normalized.slice(2) : normalized
  const globAt = withoutDot.search(GLOB_START)
  const literalPrefix = globAt === -1 ? withoutDot : withoutDot.slice(0, globAt)
  const abs = resolve(outRoot, literalPrefix || '.')
  const rel = toPosixPath(relative(packageRoot, abs))
  if (rel === '') return ''
  if (rel.startsWith('..')) return undefined
  return rel
}

function compilePackageFilesRules(patterns: string[]): PackageFilesRule[] {
  const rules: PackageFilesRule[] = []
  for (const raw of patterns) {
    const negated = raw.startsWith('!')
    const pattern = toPosixPath(negated ? raw.slice(1) : raw)
    const normalized = pattern.startsWith('./') ? pattern.slice(2) : pattern
    if (!normalized) continue

    if (!HAS_WILDCARD.test(normalized)) {
      rules.push({ kind: 'prefix', negated, value: normalized.replace(TRAILING_SLASH, '') })
      continue
    }

    const escaped = normalized
      .replace(REGEX_META, '\\$&')
      .replace(GLOBSTAR, '<<<DS>>>')
      .replace(GLOB_STAR, '[^/]*')
      .replace(GLOB_QMARK, '[^/]')
      .replace(GLOBSTAR_TOKEN, '.*')
    rules.push({ kind: 'regex', negated, value: new RegExp(`^${escaped}(?:/.*)?$`) })
  }
  return rules
}

function matchesCompiledRules(packageRelativePath: string, rules: PackageFilesRule[]): boolean {
  const path = packageRelativePath.startsWith('./') ? packageRelativePath.slice(2) : packageRelativePath
  let included = false
  for (const rule of rules) {
    const hit =
      rule.kind === 'prefix' ? path === rule.value || path.startsWith(`${rule.value}/`) : rule.value.test(path)
    if (!hit) continue
    included = !rule.negated
  }
  return included
}
