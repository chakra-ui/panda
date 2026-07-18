// @ts-nocheck
import fs from 'fs'
import path from 'path'

const toExt = (ext: string) => (file: string) => file.replace(/\.ts$/, ext)
const toDts = toExt('.d.ts')

export const main = () => {
  const inputPath = path.join(__dirname, '..', 'src')
  const distPath = path.join(__dirname, '..', 'dist')
  const files = fs.readdirSync(inputPath)

  fs.rmSync(distPath, { recursive: true, force: true })
  fs.mkdirSync(distPath, { recursive: true })

  for (const file of files) {
    const destFile = path.join(distPath, file.endsWith('.d.ts') ? file : toDts(file))
    const content = fs.readFileSync(path.join(inputPath, file))
    fs.writeFileSync(destFile, content)
  }
}

main()
