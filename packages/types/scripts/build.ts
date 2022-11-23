import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs'

const toExt = (ext: string) => (file: string) => file.replace(/\.ts$/, ext)
const toDts = toExt('.d.ts')

const files = readdirSync('src')

const getOrCreateDir = (dir: string) => {
  try {
    mkdirSync(dir)
  } catch (e) {
    // ignore
  }
}

files.forEach((file) => {
  const destFile = file.endsWith('.d.ts') ? `dist/${file}` : `dist/${toDts(file)}`
  getOrCreateDir('dist')
  writeFileSync(destFile, readFileSync(`src/${file}`))
})
