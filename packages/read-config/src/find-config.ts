import fs from 'fs'
import path from 'path'
import { createDebug } from './debug'
import { findUp } from './find-up'

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
    createDebug('find:file', '💥 no config file found.')
    return null
  }

  return { resolvedPath, isTS, isESM }
}
