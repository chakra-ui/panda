/* eslint-disable no-console */
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs-extra'
import { execa } from 'execa'

const dir = typeof __dirname === 'string' ? __dirname : dirname(fileURLToPath(import.meta.url))
const root = dirname(dir)

async function publish() {
  const pkgPath = join(root, 'package.json')
  const rawJSON = await fs.readFile(pkgPath, 'utf-8')
  const pkg = JSON.parse(rawJSON)
  pkg.name = 'panda-css-vscode'
  await fs.writeJSON(pkgPath, pkg, { spaces: 2 })

  await execa('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' })

  try {
    console.log('\nPublish to VSCE...\n')
    await execa('npx', ['vsce', 'publish', '--no-dependencies', '-p', process.env.VSCE_TOKEN!], {
      cwd: root,
      stdio: 'inherit',
    })
    // console.log('\nPublish to OVSE...\n')
    // await execa('npx', ['ovsx', 'publish', '--no-dependencies', '-p', process.env.OVSX_TOKEN!], { cwd: root, stdio: 'inherit' })
  } finally {
    await fs.writeFile(pkgPath, rawJSON, 'utf-8')
  }
}

publish()
