import { realpathSync } from 'node:fs'
import { createRequire, Module } from 'node:module'
import { dirname, extname, join } from 'node:path'
import { build, type BuildOptions } from 'esbuild'

// Vendored from `bundle-n-require` with the fallback fixed: the original re-evaluates the
// bundle without a filename, so a failing config reports "Please pass in filename to use
// require" instead of the real error (most visible under bun).

type ConfigModule = { default?: unknown } & Record<string, unknown>

// `_compile` / `_nodeModulePaths` are internal Node APIs missing from `@types/node`.
interface CompilableModule {
  _compile(code: string, filename: string): unknown
}
const ModuleInternals = Module as unknown as { _nodeModulePaths(from: string): string[] }

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

// Node path: patch `require.extensions` so `require(file)` compiles the bundled code.
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

// Fallback (`.mjs`, or bun ignoring `require.extensions`): compile with the real filename
// so inner `require()` resolves and a broken config throws its real error.
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
