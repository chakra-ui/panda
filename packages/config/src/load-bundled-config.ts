import fs from 'fs'
import { createRequire } from 'module'
import path from 'path'

const req = typeof globalThis.require === 'function' ? globalThis.require : createRequire(import.meta.url)

export function loadBundledFile(fileName: string, bundledCode: string): Promise<any> {
  const extension = path.extname(fileName)
  const realFileName = fs.realpathSync(fileName)

  const defaultLoader = req.extensions[extension]!

  req.extensions[extension] = (module: NodeModule, filename: string) => {
    if (filename === realFileName) {
      const __module = module as any
      __module._compile(bundledCode, filename)
    } else {
      defaultLoader(module, filename)
    }
  }

  // clear cache in case of server restart
  delete req.cache[req.resolve(fileName)]

  const raw = req(fileName)
  const config = raw.__esModule ? raw.default : raw
  req.extensions[extension] = defaultLoader

  return config
}
