import { statSync, lstatSync, accessSync, constants } from 'fs'
import { dirname, parse, resolve } from 'path'

function existsSync(fp: string) {
  try {
    accessSync(fp, constants.R_OK)
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

export function findUp(paths: string[], options: FindUpOptions = {}): string[] {
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
