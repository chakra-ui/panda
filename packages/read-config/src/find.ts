import path from 'path'
import { debug } from '@css-panda/logger'
import fs, { constants, statSync, lstatSync } from 'fs'
import { dirname, parse, resolve } from 'path'

export function findConfigFile({ root = process.cwd(), file }: { root: string; file?: string }) {
  let resolvedPath: string | undefined
  let isTS = false
  let isESM = false

  // check package.json for type: "module" and set `isMjs` to true
  try {
    const pkgPath = findUp(['package.json'], { cwd: root })[0]
    const pkg = fs.readFileSync(pkgPath, 'utf8')
    if (pkg && JSON.parse(pkg).type === 'module') {
      isESM = true
    }
  } catch (e) {}

  if (file) {
    // explicit config path is always resolved from cwd
    resolvedPath = path.resolve(file)
    isTS = file.endsWith('.ts')

    if (file.endsWith('.mjs')) {
      isESM = true
    }
  } else {
    const extensions = ['.ts', '.js', '.mjs', '.cjs']

    extensions.forEach((ext) => {
      const jsconfigFile = path.resolve(root, `panda.config${ext}`)
      if (fs.existsSync(jsconfigFile)) {
        resolvedPath = jsconfigFile
        isESM = ext === '.mjs' || ext === '.ts'
      }
    })
  }

  if (!resolvedPath) {
    debug('💥 no config file found.')
    return null
  }

  return { resolvedPath, isTS, isESM }
}

function existsSync(fp: string) {
  try {
    fs.accessSync(fp, constants.R_OK)
    return true
  } catch {
    return false
  }
}

export interface FindUpOptions {
  /**
   * @default process.cwd
   */
  cwd?: string
  /**
   * @default path.parse(cwd).root
   */
  stopAt?: string
  /**
   * @default false
   */
  multiple?: boolean
  /**
   * @default true
   */
  allowSymlinks?: boolean
}

function findUp(paths: string[], options: FindUpOptions = {}): string[] {
  const { cwd = process.cwd(), stopAt = parse(cwd).root, multiple = false, allowSymlinks = true } = options

  let current = cwd

  const files: string[] = []

  const stat = allowSymlinks ? statSync : lstatSync

  while (current && current !== stopAt) {
    for (const path of paths) {
      const filepath = resolve(current, path)
      if (existsSync(filepath) && stat(filepath).isFile()) {
        files.push(filepath)
        if (!multiple) return files
      }
    }
    const parent = dirname(current)
    if (parent === current) break
    current = parent
  }

  return files
}
