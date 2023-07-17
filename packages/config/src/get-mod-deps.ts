import fs from 'fs'
import path from 'path'
import { type PathMapping } from './ts-config-paths'
import { resolveTsPathPattern } from './resolve-ts-path-pattern'
import ts from 'typescript'
import type { ConfigTsOptions } from '@pandacss/types'
import type { TSConfig } from 'pkg-types'

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
  compilerOptions?: TSConfig['compilerOptions']
}

const importRegex = /import[\s\S]*?['"](.{3,}?)['"]/gi
const importFromRegex = /import[\s\S]*from[\s\S]*?['"](.{3,}?)['"]/gi
const requireRegex = /require\(['"`](.+)['"`]\)/gi
const exportRegex = /export[\s\S]*from[\s\S]*?['"](.{3,}?)['"]/gi

function getDeps(opts: GetDepsOptions, fromAlias?: string) {
  const { filename, seen, compilerOptions } = opts

  // Try to find the file
  const absoluteFile = resolveWithExtension(
    path.resolve(opts.cwd, filename),
    jsExtensions.includes(opts.ext) ? jsResolutionOrder : tsResolutionOrder,
  )
  if (absoluteFile === null) return // File doesn't exist

  if (fromAlias) {
    opts.foundModuleAliases.set(fromAlias, absoluteFile)
  }

  // Prevent infinite loops when there are circular dependencies
  if (seen.size > 1 && seen.has(absoluteFile)) return // Already seen
  seen.add(absoluteFile)

  const contents = fs.readFileSync(absoluteFile, 'utf-8')
  const fileDeps = [
    ...contents.matchAll(importRegex),
    ...contents.matchAll(importFromRegex),
    ...contents.matchAll(requireRegex),
    ...contents.matchAll(exportRegex),
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

    // this is for internal monorepo packages that don't have a `dist`
    // and instead use a package.json `main` field that points to a src/xxx.ts file
    const found = ts.resolveModuleName(mod, absoluteFile, compilerOptions ?? {}, ts.sys).resolvedModule
    if (found && found.extension === '.ts') {
      getDeps(Object.assign({}, nextOpts, { filename: found.resolvedFileName }))
      return
    }

    if (!opts.pathMappings) return

    // this is for imports using `baseUrl` (ex: ./src) like `import { css } from "styled-system/css"`
    const filename = resolveTsPathPattern(opts.pathMappings, mod)
    if (!filename) return

    getDeps(Object.assign({}, nextOpts, { filename }), mod)
  })
}

export function getConfigDependencies(
  filePath: string,
  tsOptions: ConfigTsOptions = { pathMappings: [] },
  compilerOptions?: TSConfig['compilerOptions'],
) {
  if (filePath === null) return { deps: new Set<string>(), aliases: new Map<string, string>() }

  const foundModuleAliases = new Map<string, string>()
  const deps = new Set<string>()

  // Add the file itself as a dependency
  deps.add(filePath)

  getDeps({
    filename: filePath,
    ext: path.extname(filePath),
    cwd: path.dirname(filePath),
    seen: deps,
    baseUrl: tsOptions.baseUrl,
    pathMappings: tsOptions.pathMappings ?? [],
    foundModuleAliases: foundModuleAliases,
    compilerOptions,
  })

  return { deps, aliases: foundModuleAliases }
}
