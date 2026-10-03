import { existsSync, readFileSync, statSync } from 'node:fs'
import * as nodeModule from 'node:module'
import { dirname, extname, join, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { nearestPackageType } from './resolve'

const SESSION_PARAM = 'panda-config'
const TYPESCRIPT_EXTENSION = /\.[cm]?tsx?$/
const RESOLVE_EXTENSIONS = ['.ts', '.tsx', '.mts', '.js', '.mjs']

interface Session {
  files: Set<string>
  loaded: boolean
}

/** A failure of the loader itself, so the bundler should load the config instead. */
export class TranspileError extends Error {
  override name = 'TranspileError'
}

/** Node module-loading failures: the bundler resolves and loads these on its own. */
const MODULE_LOAD_ERROR_CODES = new Set([
  'ERR_IMPORT_ATTRIBUTE_MISSING',
  'ERR_IMPORT_ATTRIBUTE_TYPE_INCOMPATIBLE',
  'ERR_IMPORT_ATTRIBUTE_UNSUPPORTED',
  'ERR_INVALID_MODULE_SPECIFIER',
  'ERR_INVALID_PACKAGE_CONFIG',
  'ERR_INVALID_PACKAGE_TARGET',
  'ERR_MODULE_NOT_FOUND',
  'ERR_PACKAGE_IMPORT_NOT_DEFINED',
  'ERR_PACKAGE_PATH_NOT_EXPORTED',
  'ERR_REQUIRE_ASYNC_MODULE',
  'ERR_REQUIRE_CYCLE_MODULE',
  'ERR_REQUIRE_ESM',
  'ERR_UNKNOWN_FILE_EXTENSION',
  'ERR_UNKNOWN_MODULE_FORMAT',
  'ERR_UNSUPPORTED_DIR_IMPORT',
  'ERR_UNSUPPORTED_ESM_URL_SCHEME',
  'MODULE_NOT_FOUND',
])

const COMMONJS_GLOBAL_MISSING = /^(require|module|exports|__dirname|__filename) is not defined\b/

/**
 * Whether `error` came from loading modules rather than from running the config.
 * Only these fall back to the bundler; an error the config throws surfaces as is.
 */
export function isLoaderFailure(error: unknown): boolean {
  if (error instanceof TranspileError) return true
  const code = (error as { code?: unknown } | undefined)?.code
  if (typeof code === 'string' && MODULE_LOAD_ERROR_CODES.has(code)) return true
  // Linking fails with a SyntaxError (a missing named export, an ESM/CommonJS mismatch).
  if (error instanceof SyntaxError) return true
  return error instanceof ReferenceError && COMMONJS_GLOBAL_MISSING.test(error.message)
}

const sessions = new Map<string, Session>()
/** Local CommonJS files a config loaded. Node caches these by path, ignoring the session query. */
const commonjsFiles = new Set<string>()
const requireCache = nodeModule.createRequire(import.meta.url).cache
let hooksRegistered: Promise<void> | undefined
let nextSession = 0

export function canTranspile(file: string): boolean {
  return typeof nodeModule.registerHooks === 'function' && !/\.c[jt]s$/.test(file)
}

export async function importTranspiled<T>(
  file: string,
  evaluate: (mod: Record<string, unknown>) => Promise<T>,
): Promise<{ value: T; files: string[] }> {
  hooksRegistered ??= registerTranspileHooks()
  await hooksRegistered.catch((cause: unknown) => {
    throw new TranspileError('Could not register the transpile hooks.', { cause })
  })

  for (const commonjsFile of commonjsFiles) delete requireCache[commonjsFile]

  const id = String(++nextSession)
  const session: Session = { files: new Set([file]), loaded: false }
  sessions.set(id, session)
  try {
    const mod = await import(/* @vite-ignore */ withSession(pathToFileURL(file).href, id))
    if (!session.loaded) throw new TranspileError('Config was not loaded through the Panda transpile hooks.')
    return { value: await evaluate(mod), files: Array.from(session.files) }
  } finally {
    sessions.delete(id)
  }
}

async function registerTranspileHooks(): Promise<void> {
  const { transformSync } = await import('rolldown/utils')

  nodeModule.registerHooks({
    resolve(specifier, context, nextResolve) {
      const id = sessionId(context.parentURL)
      if (!id || !context.parentURL) return nextResolve(specifier, context)

      const tag = (file: string) => {
        sessions.get(id)?.files.add(file)
        return { url: withSession(pathToFileURL(file).href, id), shortCircuit: true }
      }

      if (isRelative(specifier)) {
        const file = resolveRelative(specifier, context.parentURL)
        return file ? tag(file) : nextResolve(specifier, context)
      }

      const resolved = nextResolve(specifier, context)
      const linked = linkedPackageFile(resolved.url)
      if (linked) return tag(linked)
      // Node and bundlers disagree on a CommonJS default export (`__esModule`). Resolving happens
      // before any module runs, so handing the config to the bundler here runs it once.
      if (isCommonJs(resolved)) {
        throw new TranspileError(`${specifier} is CommonJS, so the bundler loads this config.`)
      }
      return resolved
    },
    load(url, context, nextLoad) {
      const id = sessionId(url)
      if (!id) return nextLoad(url, context)

      const session = sessions.get(id)
      if (session) session.loaded = true

      const file = fileURLToPath(url)
      if (!TYPESCRIPT_EXTENSION.test(file)) {
        const loaded = nextLoad(url, context)
        if (loaded.format === 'commonjs') commonjsFiles.add(file)
        return loaded
      }

      const result = transformSync(file, readFileSync(file, 'utf8'))
      if (result.errors.length > 0) {
        throw new TranspileError(`Could not transpile ${file}.`, { cause: result.errors[0] })
      }
      return { format: 'module', source: result.code, shortCircuit: true }
    },
  })
}

/** Node often leaves `format` unset until it loads the file, so apply its extension and `"type"` rules. */
function isCommonJs(resolved: { url: string; format?: string | null }): boolean {
  if (resolved.format) return resolved.format === 'commonjs'
  if (!resolved.url.startsWith('file:')) return false
  const file = fileURLToPath(resolved.url)
  if (file.endsWith('.cjs')) return true
  return file.endsWith('.js') && nearestPackageType(dirname(file)) !== 'module'
}

function sessionId(url: string | undefined): string | undefined {
  if (!url?.startsWith('file:') || !url.includes(`${SESSION_PARAM}=`)) return undefined
  return new URL(url).searchParams.get(SESSION_PARAM) ?? undefined
}

function withSession(url: string, id: string): string {
  return `${url}?${SESSION_PARAM}=${id}`
}

function isRelative(specifier: string): boolean {
  return specifier.startsWith('./') || specifier.startsWith('../')
}

function linkedPackageFile(url: string): string | undefined {
  if (!url.startsWith('file:')) return undefined
  const file = fileURLToPath(url)
  return file.includes(`${sep}node_modules${sep}`) ? undefined : file
}

function resolveRelative(specifier: string, parentURL: string): string | undefined {
  const base = fileURLToPath(new URL(specifier, parentURL))
  const candidates = [
    base,
    ...RESOLVE_EXTENSIONS.map((extension) => base + extension),
    ...(extname(base) === '.js' ? [base.slice(0, -3) + '.ts'] : []),
    ...RESOLVE_EXTENSIONS.map((extension) => join(base, `index${extension}`)),
  ]
  return candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile())
}
