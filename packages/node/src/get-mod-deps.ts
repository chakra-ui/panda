import fs from 'fs'
import path from 'path'

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

function* getDeps(filename: string, base: string, seen: Set<string>, ext = path.extname(filename)): any {
  // Try to find the file
  const absoluteFile = resolveWithExtension(
    path.resolve(base, filename),
    jsExtensions.includes(ext) ? jsResolutionOrder : tsResolutionOrder,
  )
  if (absoluteFile === null) return // File doesn't exist

  // Prevent infinite loops when there are circular dependencies
  if (seen.has(absoluteFile)) return // Already seen
  seen.add(absoluteFile)

  // Mark the file as a dependency
  yield absoluteFile

  // Resolve new base for new imports/requires
  base = path.dirname(absoluteFile)
  ext = path.extname(absoluteFile)

  const contents = fs.readFileSync(absoluteFile, 'utf-8')

  // Find imports/requires
  for (const match of [
    ...contents.matchAll(/import[\s\S]*?['"](.{3,}?)['"]/gi),
    ...contents.matchAll(/import[\s\S]*from[\s\S]*?['"](.{3,}?)['"]/gi),
    ...contents.matchAll(/require\(['"`](.+)['"`]\)/gi),
  ]) {
    // Bail out if it's not a relative file
    if (!match[1].startsWith('.')) continue

    yield* getDeps(match[1], base, seen, ext)
  }
}

export function getModuleDependencies(filePath: string): Set<string> {
  if (filePath === null) return new Set()
  return new Set(getDeps(filePath, path.dirname(filePath), new Set()))
}
