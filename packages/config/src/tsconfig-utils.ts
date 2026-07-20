/**
 * Utilities for resolving tsconfig.json files and matching source files
 * against tsconfig include/exclude/files globs.
 *
 * Replaces the discontinued `tsconfck` package. Uses `get-tsconfig` for
 * parsing (including `extends` chains) and implements tsconfck-compatible
 * glob matching for project-reference resolution.
 */
import type { TsConfigJsonResolved } from 'get-tsconfig'
import { promises as fs } from 'node:fs'
import path from 'node:path'

// ---------------------------------------------------------------------------
// Find tsconfig
// ---------------------------------------------------------------------------

/**
 * If `filename` points to a `.json` file that exists as a regular file, return its absolute path.
 */
export async function resolveDirectTsconfigJson(filename: string): Promise<string | null> {
  if (path.extname(filename) !== '.json') return null
  const resolved = path.resolve(filename)
  try {
    const stat = await fs.stat(resolved)
    if (stat.isFile() || stat.isFIFO()) return resolved
    throw new Error(`${filename} exists but is not a regular file.`)
  } catch (e) {
    if (e && typeof e === 'object' && 'code' in e && (e as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    throw e
  }
}

/**
 * Walk upward from `dirname(filename)` and return the first existing `configName`,
 * stopping at `root` (inclusive) or the filesystem root.
 */
export async function findClosestTsconfig(
  filename: string,
  root: string,
  configName = 'tsconfig.json',
): Promise<string | null> {
  const resolvedRoot = path.resolve(root)
  let dir = path.dirname(path.resolve(filename))

  for (;;) {
    const candidate = path.join(dir, configName)
    try {
      const stat = await fs.stat(candidate)
      if (stat.isFile() || stat.isFIFO()) {
        return candidate
      }
    } catch {
      // ENOENT: continue
    }

    if (dir === resolvedRoot || path.dirname(dir) === dir) {
      return null
    }
    dir = path.dirname(dir)
  }
}

// ---------------------------------------------------------------------------
// Resolve baseUrl
// ---------------------------------------------------------------------------

/**
 * Resolve `compilerOptions.baseUrl` the same way TypeScript does: relative to the tsconfig file.
 * Falls back to `cwd` when `baseUrl` is omitted.
 */
export function resolveBaseUrlForCompilerOptions(
  baseUrl: string | undefined,
  tsconfigFile: string,
  cwd: string,
): string {
  if (baseUrl == null) return cwd
  if (baseUrl.startsWith('${')) return baseUrl
  if (path.isAbsolute(baseUrl)) return baseUrl
  return path.resolve(path.dirname(tsconfigFile), baseUrl)
}

// ---------------------------------------------------------------------------
// Solution-style project references
// ---------------------------------------------------------------------------

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts']

function resolveReferencedTsconfigPath(refPath: string, fromDir: string, configName = 'tsconfig.json') {
  const p = refPath.endsWith('.json') ? refPath : path.join(refPath, configName)
  return path.resolve(fromDir, p)
}

/**
 * When a file belongs to a referenced project (TypeScript project references),
 * return that project's merged tsconfig for `compilerOptions`.
 */
export async function resolveSolutionTsconfigForFile(
  absoluteFilename: string,
  rootTsconfigPath: string,
  rootParsed: TsConfigJsonResolved,
  getTsconfigModule: typeof import('get-tsconfig'),
): Promise<{ tsconfig: TsConfigJsonResolved; tsconfigFile: string }> {
  const { parseTsconfig } = getTsconfigModule

  if (isSourceFileIncludedInTsconfig(absoluteFilename, rootTsconfigPath, rootParsed)) {
    return { tsconfig: rootParsed, tsconfigFile: rootTsconfigPath }
  }

  const refs = rootParsed.references
  if (!refs?.length) {
    return { tsconfig: rootParsed, tsconfigFile: rootTsconfigPath }
  }

  if (!SOURCE_EXTENSIONS.some((ext) => absoluteFilename.endsWith(ext))) {
    return { tsconfig: rootParsed, tsconfigFile: rootTsconfigPath }
  }

  const rootDir = path.dirname(rootTsconfigPath)
  for (const ref of refs) {
    const refPath = resolveReferencedTsconfigPath(ref.path, rootDir)
    try {
      await fs.access(refPath)
    } catch {
      continue
    }
    const childParsed = parseTsconfig(refPath)
    if (isSourceFileIncludedInTsconfig(absoluteFilename, refPath, childParsed)) {
      return { tsconfig: childParsed, tsconfigFile: refPath }
    }
  }

  return { tsconfig: rootParsed, tsconfigFile: rootTsconfigPath }
}

// ---------------------------------------------------------------------------
// Tsconfig include/exclude/files matching
//
// Ported from tsconfck's glob semantics because get-tsconfig's
// createFilesMatcher doesn't handle some valid patterns (e.g. `src/*`).
// ---------------------------------------------------------------------------

const POSIX_SEP_RE = new RegExp('\\' + path.posix.sep, 'g')
const NATIVE_SEP_RE = new RegExp('\\' + path.sep, 'g')
const PATTERN_REGEX_CACHE = new Map<string, RegExp>()
const GLOB_ALL_PATTERN = `**/*`
const TS_EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts']
const JS_EXTENSIONS = ['.js', '.jsx', '.mjs', '.cjs']
const TSJS_EXTENSIONS = TS_EXTENSIONS.concat(JS_EXTENSIONS)
const TS_EXTENSIONS_RE_GROUP = `\\.(?:${TS_EXTENSIONS.map((ext) => ext.slice(1)).join('|')})`
const TSJS_EXTENSIONS_RE_GROUP = `\\.(?:${TSJS_EXTENSIONS.map((ext) => ext.slice(1)).join('|')})`
const IS_POSIX = path.posix.sep === path.sep

const native2posix = IS_POSIX
  ? (filename: string) => filename
  : (filename: string) => filename.replace(NATIVE_SEP_RE, path.posix.sep)

const resolve2posix = IS_POSIX
  ? (dir: string | null, filename: string) => (dir ? path.resolve(dir, filename) : path.resolve(filename))
  : (dir: string | null, filename: string) => {
      const posix2native = (f: string) => f.replace(POSIX_SEP_RE, path.sep)
      return native2posix(
        dir ? path.resolve(posix2native(dir), posix2native(filename)) : path.resolve(posix2native(filename)),
      )
    }

function isGlobMatch(filename: string, dir: string, patterns: string[], allowJs: boolean | undefined) {
  const extensions = allowJs ? TSJS_EXTENSIONS : TS_EXTENSIONS
  return patterns.some((patternArg) => {
    let pattern = patternArg
    let lastWildcardIndex = pattern.length
    let hasWildcard = false
    let hasExtension = false
    let hasSlash = false
    let lastSlashIndex = -1
    for (let i = pattern.length - 1; i > -1; i--) {
      const c = pattern[i]
      if (!hasWildcard) {
        if (c === '*' || c === '?') {
          lastWildcardIndex = i
          hasWildcard = true
        }
      }
      if (!hasSlash) {
        if (c === '.') {
          hasExtension = true
        } else if (c === '/') {
          lastSlashIndex = i
          hasSlash = true
        }
      }
      if (hasWildcard && hasSlash) {
        break
      }
    }
    if (!hasExtension && (!hasWildcard || lastWildcardIndex < lastSlashIndex)) {
      pattern += `${pattern.endsWith('/') ? '' : '/'}${GLOB_ALL_PATTERN}`
      lastWildcardIndex = pattern.length - 1
      hasWildcard = true
    }

    if (lastWildcardIndex < pattern.length - 1 && !filename.endsWith(pattern.slice(lastWildcardIndex + 1))) {
      return false
    }

    if (pattern.endsWith('*') && !extensions.some((ext) => filename.endsWith(ext))) {
      return false
    }

    if (pattern === GLOB_ALL_PATTERN) {
      return filename.startsWith(`${dir}/`)
    }

    const resolvedPattern = resolve2posix(dir, pattern)

    let firstWildcardIndex = -1
    for (let i = 0; i < resolvedPattern.length; i++) {
      if (resolvedPattern[i] === '*' || resolvedPattern[i] === '?') {
        firstWildcardIndex = i
        hasWildcard = true
        break
      }
    }
    if (firstWildcardIndex > 1 && !filename.startsWith(resolvedPattern.slice(0, firstWildcardIndex - 1))) {
      return false
    }

    if (!hasWildcard) {
      return filename === resolvedPattern
    }
    if (
      firstWildcardIndex + GLOB_ALL_PATTERN.length ===
        resolvedPattern.length - (pattern.length - 1 - lastWildcardIndex) &&
      resolvedPattern.slice(firstWildcardIndex, firstWildcardIndex + GLOB_ALL_PATTERN.length) === GLOB_ALL_PATTERN
    ) {
      return true
    }
    if (PATTERN_REGEX_CACHE.has(resolvedPattern)) {
      return PATTERN_REGEX_CACHE.get(resolvedPattern)!.test(filename)
    }
    const regex = pattern2regex(resolvedPattern, allowJs)
    PATTERN_REGEX_CACHE.set(resolvedPattern, regex)
    return regex.test(filename)
  })
}

function pattern2regex(resolvedPattern: string, allowJs: boolean | undefined) {
  let regexStr = '^'
  for (let i = 0; i < resolvedPattern.length; i++) {
    const char = resolvedPattern[i]
    if (char === '?') {
      regexStr += '[^\\/]'
      continue
    }
    if (char === '*') {
      if (resolvedPattern[i + 1] === '*' && resolvedPattern[i + 2] === '/') {
        i += 2
        regexStr += '(?:[^\\/]*\\/)*'
        continue
      }
      regexStr += '[^\\/]*'
      continue
    }
    if ('/.+^${}()|[]\\'.includes(char)) {
      regexStr += '\\'
    }
    regexStr += char
  }

  if (resolvedPattern.endsWith('*')) {
    regexStr += allowJs ? TSJS_EXTENSIONS_RE_GROUP : TS_EXTENSIONS_RE_GROUP
  }
  regexStr += '$'

  return new RegExp(regexStr)
}

function isIncluded(filename: string, tsconfigFile: string, tsconfig: TsConfigJsonResolved) {
  const dir = native2posix(path.dirname(tsconfigFile))
  const files = (tsconfig.files || []).map((file) => resolve2posix(dir, file))
  const absoluteFilename = resolve2posix(null, filename)
  if (files.includes(filename)) {
    return true
  }
  const allowJs = tsconfig.compilerOptions?.allowJs
  const included = isGlobMatch(
    absoluteFilename,
    dir,
    tsconfig.include || (tsconfig.files ? [] : [GLOB_ALL_PATTERN]),
    allowJs,
  )
  if (included) {
    const excluded = isGlobMatch(absoluteFilename, dir, tsconfig.exclude || [], allowJs)
    return !excluded
  }
  return false
}

/** Whether `absoluteFilename` is part of the compilation set defined by this tsconfig. */
export function isSourceFileIncludedInTsconfig(
  absoluteFilename: string,
  tsconfigFile: string,
  tsconfig: TsConfigJsonResolved,
) {
  return isIncluded(absoluteFilename, tsconfigFile, tsconfig)
}
