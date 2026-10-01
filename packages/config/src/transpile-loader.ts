import { existsSync, readFileSync, statSync } from 'node:fs'
import * as nodeModule from 'node:module'
import { extname, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const SESSION_PARAM = 'panda-config'
const TYPESCRIPT_EXTENSION = /\.[cm]?tsx?$/
const RESOLVE_EXTENSIONS = ['.ts', '.tsx', '.mts', '.js', '.mjs']

type Transform = typeof import('rolldown/utils').transformSync

interface Session {
  files: Set<string>
  loaded: boolean
}

const sessions = new Map<string, Session>()
let transform: Transform | undefined
let nextSession = 0

export function canTranspile(file: string): boolean {
  return typeof nodeModule.registerHooks === 'function' && !/\.c[jt]s$/.test(file)
}

export async function importTranspiled<T>(
  file: string,
  evaluate: (mod: Record<string, unknown>) => Promise<T>,
): Promise<{ value: T; files: string[] }> {
  await registerTranspileHooks()

  const id = String(++nextSession)
  const session: Session = { files: new Set([file]), loaded: false }
  sessions.set(id, session)
  try {
    const mod = await import(/* @vite-ignore */ withSession(pathToFileURL(file).href, id))
    if (!session.loaded) throw new Error('Config was not loaded through the Panda transpile hooks.')
    return { value: await evaluate(mod), files: Array.from(session.files) }
  } finally {
    sessions.delete(id)
  }
}

async function registerTranspileHooks(): Promise<void> {
  if (transform) return
  transform = (await import('rolldown/utils')).transformSync

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
      return linked ? tag(linked) : resolved
    },
    load(url, context, nextLoad) {
      const id = sessionId(url)
      if (!id) return nextLoad(url, context)

      const session = sessions.get(id)
      if (session) session.loaded = true

      const file = fileURLToPath(url)
      if (!TYPESCRIPT_EXTENSION.test(file)) return nextLoad(url, context)

      const result = transform!(file, readFileSync(file, 'utf8'))
      if (result.errors.length > 0) throw result.errors[0]
      return { format: 'module', source: result.code, shortCircuit: true }
    },
  })
}

function sessionId(url: string | undefined): string | undefined {
  if (!url?.startsWith('file:')) return undefined
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
    ...RESOLVE_EXTENSIONS.map((extension) => `${base}/index${extension}`),
  ]
  return candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile())
}
