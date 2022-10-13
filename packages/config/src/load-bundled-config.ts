import fs from 'fs'
import path from 'path'

export function loadBundledFile(fileName: string, code: string): Promise<any> {
  const extension = path.extname(fileName)
  const realFileName = fs.realpathSync(fileName)

  const loader = require.extensions[extension]!

  require.extensions[extension] = (mod: any, filename: string) => {
    if (filename === realFileName) {
      mod._compile(code, filename)
    } else {
      loader(mod, filename)
    }
  }

  // clear cache in case of server restart
  delete require.cache[require.resolve(fileName)]

  const raw = require(fileName)
  const config = raw.__esModule ? raw.default : raw

  require.extensions[extension] = loader

  return config
}
