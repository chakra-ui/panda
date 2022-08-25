import fs from 'fs'
import module from 'module'
import path from 'path'

const __require = module.createRequire(import.meta.url)

export function loadBundledFile(fileName: string, bundledCode: string): Promise<any> {
  const extension = path.extname(fileName)
  const realFileName = fs.realpathSync(fileName)

  const defaultLoader = __require.extensions[extension]!

  __require.extensions[extension] = (module: NodeModule, filename: string) => {
    if (filename === realFileName) {
      ;(module as any)._compile(bundledCode, filename)
    } else {
      defaultLoader(module, filename)
    }
  }

  // clear cache in case of server restart
  delete __require.cache[__require.resolve(fileName)]

  const raw = __require(fileName)
  const config = raw.__esModule ? raw.default : raw
  __require.extensions[extension] = defaultLoader

  return config
}
