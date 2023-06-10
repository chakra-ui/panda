import fs from 'fs'
import path from 'path'
import { resolveTsPathPattern, type PathMapping } from './ts-config-paths-mappings'

const jsExtensions = ['.js', '.cjs', '.mjs']

const jsResolutionOrder = ['', '.js', '.cjs', '.mjs', '.ts', '.cts', '.mts', '.jsx', '.tsx']
const tsResolutionOrder = ['', '.ts', '.cts', '.mts', '.tsx', '.js', '.cjs', '.mjs', '.jsx']

function resolveWithExtension(file: string, extensions: string[]) {
  // Try to find `./a.ts`, `./a.ts`, ... from `./a`
  for (const ext of extensions) {
    const full = `${file}${ext}`
    if (fs.existsSync(full) && fs.statSync(full).isFile()) {
      return full
    }
  }

  // Try to find `./a/index.js` from `./a`
  for (const ext of extensions) {
    const full = `${file}/index${ext}`
    if (fs.existsSync(full)) {
      return full
    }
  }

  return null
}

export type GetDepsOptions = {
  filename: string
  ext: string
  cwd: string
  seen: Set<string>
  baseUrl: string | undefined
  pathMappings: PathMapping[]
  foundModuleAliases: Map<string, string>
}

function getDeps(opts: GetDepsOptions, fromAlias?: string) {
  const { filename, seen } = opts

  // Try to find the file
  const absoluteFile = resolveWithExtension(
    path.resolve(opts.cwd, filename),
    jsExtensions.includes(opts.ext) ? jsResolutionOrder : tsResolutionOrder,
  )
  if (absoluteFile === null) return // File doesn't exist

  if (fromAlias) {
    console.log({ fromAlias, filename, absoluteFile })
    opts.foundModuleAliases.set(fromAlias, absoluteFile)
  }

  // Prevent infinite loops when there are circular dependencies
  if (seen.has(absoluteFile)) return // Already seen
  seen.add(absoluteFile)

  const contents = fs.readFileSync(absoluteFile, 'utf-8')
  const fileDeps = [
    ...contents.matchAll(/import[\s\S]*?['"](.{3,}?)['"]/gi),
    ...contents.matchAll(/import[\s\S]*from[\s\S]*?['"](.{3,}?)['"]/gi),
    ...contents.matchAll(/require\(['"`](.+)['"`]\)/gi),
  ]
  if (!fileDeps.length) return // No deps

  const nextOpts: Omit<GetDepsOptions, 'filename'> = {
    // Resolve new base for new imports/requires
    cwd: path.dirname(absoluteFile),
    ext: path.extname(absoluteFile),
    seen,
    baseUrl: opts.baseUrl,
    pathMappings: opts.pathMappings,
    foundModuleAliases: opts.foundModuleAliases,
  }

  fileDeps.forEach((match) => {
    const mod = match[1]

    if (mod[0] === '.') {
      getDeps(Object.assign({}, nextOpts, { filename: mod }))
      return
    }

    if (!opts.pathMappings) return

    const filename = resolveTsPathPattern(opts.pathMappings, mod)
    if (!filename) return

    console.log({ mod, filename })

    getDeps(Object.assign({}, nextOpts, { filename }), mod)
  })
}

export type GetConfigDependenciesTsOptions = {
  baseUrl?: string | undefined
  pathMappings: PathMapping[]
}

export function getConfigDependencies(
  filePath: string,
  tsOptions: GetConfigDependenciesTsOptions = { pathMappings: [] },
) {
  if (filePath === null) return { deps: new Set<string>(), aliases: new Map<string, string>() }

  const foundModuleAliases = new Map<string, string>()
  const deps = new Set<string>()

  getDeps({
    filename: filePath,
    ext: path.extname(filePath),
    cwd: path.dirname(filePath),
    seen: deps,
    baseUrl: tsOptions.baseUrl,
    pathMappings: tsOptions.pathMappings ?? [],
    foundModuleAliases: foundModuleAliases,
  })

  return { deps, aliases: foundModuleAliases }
}
