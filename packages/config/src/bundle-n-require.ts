import { realpathSync } from 'node:fs'
import { createRequire, Module } from 'node:module'
import { dirname, extname, join } from 'node:path'
import { build, type BuildOptions } from 'esbuild'

/**
 * Inlined and fixed fork of `bundle-n-require`.
 *
 * The published package wraps the load in a bare `catch {}` that falls back to
 * `node-eval(code)` with no filename. When the fallback runs, the original error
 * is swallowed and the bundled code's first `require()` (a `node:` builtin is
 * enough) throws "Please pass in filename to use require" instead. Under bun the
 * `try` is more likely to fail, so that misleading message is all the user sees.
 *
 * This version keeps the Node happy path identical and fixes the fallback: it
 * compiles the bundled code with the real config filename, so `require()` resolves
 * and a genuinely broken config surfaces its real error.
 */

/** Exports of an evaluated config module, before unwrapping a `default` export. */
type ConfigModule = { default?: unknown } & Record<string, unknown>

/** `Module._compile` is an internal Node API not present in `@types/node`. */
interface CompilableModule {
  _compile(code: string, filename: string): unknown
}

/** `Module._nodeModulePaths` is likewise internal. */
const ModuleInternals = Module as unknown as {
  _nodeModulePaths(from: string): string[]
}

export interface BundleNRequireOptions {
  cwd?: string
}

export interface BundleNRequireResult {
  mod: ConfigModule
  code: string
  dependencies: string[]
}

async function bundleConfigFile(file: string, cwd: string, options?: BuildOptions) {
  const result = await build({
    platform: 'node',
    format: 'cjs',
    mainFields: ['module', 'main'],
    ...options,
    absWorkingDir: cwd,
    entryPoints: [file],
    outfile: 'out.js',
    write: false,
    bundle: true,
    sourcemap: false,
    metafile: true,
  })

  const { text } = result.outputFiles[0]

  return {
    code: text,
    dependencies: result.metafile ? Object.keys(result.metafile.inputs) : [],
  }
}

/**
 * Patch `require.extensions` so a plain `require(file)` compiles the already
 * bundled code instead of re-reading the original source. This is the Node path.
 */
function loadBundledFile(req: NodeRequire, file: string, code: string): ConfigModule {
  const extension = extname(file)
  const realFileName = realpathSync.native(file)
  const loader = req.extensions[extension]

  req.extensions[extension] = (mod, filename) => {
    if (filename === realFileName) {
      ;(mod as unknown as CompilableModule)._compile(code, filename)
    } else {
      loader?.(mod, filename)
    }
  }

  try {
    delete req.cache[req.resolve(file)]
    const raw = req(file) as ConfigModule
    return (raw?.default ?? raw) as ConfigModule
  } finally {
    if (loader) req.extensions[extension] = loader
    else delete req.extensions[extension]
  }
}

/**
 * Fallback for runtimes/extensions where `require(file)` is not intercepted
 * (`.mjs` configs, or bun ignoring `require.extensions`). Compiling with the real
 * filename gives any inner `require()` a resolution base, and lets a broken config
 * throw its real error instead of node-eval's masking message.
 */
function evalBundledFile(file: string, code: string): ConfigModule {
  const mod = new Module(file) as Module & CompilableModule
  mod.filename = file
  mod.paths = ModuleInternals._nodeModulePaths(dirname(file))
  mod._compile(code, file)
  const raw = mod.exports as ConfigModule
  return (raw?.default ?? raw) as ConfigModule
}

export async function bundleNRequire(file: string, opts: BundleNRequireOptions = {}): Promise<BundleNRequireResult> {
  const { cwd = process.cwd() } = opts
  const req = createRequire(join(cwd, 'index.js'))
  const absPath = req.resolve(file)
  const { code, dependencies } = await bundleConfigFile(absPath, cwd)

  let mod: ConfigModule
  try {
    mod = loadBundledFile(req, absPath, code)
  } catch {
    mod = evalBundledFile(absPath, code)
  }

  return { mod, code, dependencies }
}
