import { lookItUpSync } from 'look-it-up'
import fs from 'fs'
import path from 'path'
import { createDebug } from './debug'

export function findConfigFile({ root, file }: { root: string; file?: string }) {
  let filepath: string | undefined
  let isESM = false

  // check package.json for type: "module" and set `isMjs` to true
  try {
    const pkgPath = lookItUpSync('package.json', root)
    if (pkgPath) {
      const pkg = fs.readFileSync(pkgPath, 'utf8')
      if (pkg && JSON.parse(pkg).type === 'module') {
        isESM = true
      }
    }
  } catch (e) {
    // ignore
  }

  if (file) {
    // explicit config path is always resolved from cwd
    filepath = path.resolve(file)
    isESM = file.endsWith('.mjs') || file.endsWith('.ts')
    //
  } else {
    //
    const extensions = ['.ts', '.js', '.mjs', '.cjs']

    for (const ext of extensions) {
      //
      const jsconfigFile = path.resolve(root, `panda.config${ext}`)

      if (fs.existsSync(jsconfigFile)) {
        filepath = jsconfigFile
        isESM = ext === '.mjs' || ext === '.ts'
      }
    }
  }

  if (!filepath) {
    createDebug('find:file', '💥 no config file found.')
    return null
  }

  return { filepath, isESM }
}
