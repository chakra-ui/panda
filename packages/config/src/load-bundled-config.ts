import fs from 'fs'
import { createRequire } from 'module'
import path from 'path'

const req = typeof require === 'function' ? require : createRequire(import.meta.url)

export function loadBundledFile(fileName: string, code: string): Promise<any> {
  const extension = path.extname(fileName)
  const realFileName = fs.realpathSync(fileName)

  const loader = req.extensions[extension]!

  req.extensions[extension] = (mod: any, filename: string) => {
    if (filename === realFileName) {
      mod._compile(code, filename)
    } else {
      loader(mod, filename)
    }
  }

  // clear cache in case of server restart
  delete req.cache[req.resolve(fileName)]

  const raw = req(fileName)
  const config = raw.__esModule ? raw.default : raw

  req.extensions[extension] = loader

  return config
}
