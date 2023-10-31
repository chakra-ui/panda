import fs from 'fs'
import path from 'path'

const toExt = (ext: string) => (file: string) => file.replace(/\.ts$/, ext)
const toDts = toExt('.d.ts')

export const main = () => {
  const inputPath = path.join(__dirname, '..', 'src')
  const files = fs.readdirSync(inputPath)

  const getOrCreateDir = (dir: string) => {
    try {
      fs.mkdirSync(dir)
    } catch (e) {
      // ignore
    }
  }

  files.forEach((file) => {
    const destFile = path.join('dist', file.endsWith('.d.ts') ? file : toDts(file))
    getOrCreateDir('dist')
    const content = fs.readFileSync(path.join('src', file))
    fs.writeFileSync(destFile, content)
  })
}

main()
