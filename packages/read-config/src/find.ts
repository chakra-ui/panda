import path from 'path'
import fs from 'fs'
import { debug } from '@css-panda/logger'
import { findUpSync } from 'find-up'

export function findConfigFile({ root = process.cwd(), file }: { root: string; file?: string }) {
  let resolvedPath: string | undefined
  let isTS = false
  let isESM = false

  // check package.json for type: "module" and set `isMjs` to true
  try {
    const pkg = findUpSync('package.json', { cwd: root })
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
