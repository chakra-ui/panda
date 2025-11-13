import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import fs from 'node:fs/promises'
import { afterAll } from 'vitest'
import { beforeAll } from 'vitest'

describe('CLI', () => {
  const cwd = process.cwd()
  const _dirname = path.dirname(fileURLToPath(import.meta.url))
  const binPath = path.resolve(cwd, _dirname, '../bin.js')

  const testsCwd = path.resolve(cwd, _dirname, './samples')
  const paths = {
    config: path.resolve(testsCwd, 'panda.config.ts'),
    postcssConfig: path.resolve(testsCwd, 'postcss.config.cjs'),
    styledSystem: path.resolve(testsCwd, 'styled-system'),
    logFile: path.resolve(testsCwd, 'panda.log'),
    studio: path.resolve(testsCwd, 'styled-system-studio'),
    pkgJson: path.resolve(testsCwd, 'package.json'),
  }

  beforeAll(async () => {
    // Create the `samples` folder
    await fs.mkdir(testsCwd, { recursive: true })
  })

  afterAll(async () => {
    try {
      await Promise.allSettled([
        fs.unlink(paths.config),
        fs.unlink(paths.postcssConfig),
        fs.unlink(paths.logFile),
        fs.rm(paths.styledSystem, { recursive: true }),
        fs.rm(paths.studio, { recursive: true }),
      ])
    } catch {
      //
    }
  })

  test('init', async () => {
    // Clean up config file before test to ensure fresh state
    try {
      await fs.unlink(paths.config)
    } catch {
      // Ignore if file doesn't exist
    }

    const cmd = `node ${binPath} init --cwd="${testsCwd}"`

    // init
    const output = execSync(cmd, { cwd: testsCwd }).toString()
    expect(output.includes('Thanks')).toBe(true)

    // Check if the config file was created
    const configFileExists = await fs.access(paths.config)
    expect(configFileExists).toBeUndefined()

    // init on existing project
    const output2 = execSync(cmd, { cwd: testsCwd }).toString()
    expect(output2.includes('It looks like you already have panda created')).toBe(true)

    // init with --force
    const output3 = execSync(cmd + ' --force --postcss --logfile="./panda.log"', { cwd: testsCwd }).toString()
    expect(output3.includes('Panda initialized')).toBe(true)

    // Check if the postcss config file was created
    const postcssConfigFileExists = await fs.access(paths.postcssConfig)
    expect(postcssConfigFileExists).toBeUndefined()

    // Check if the log file was created
    const logFileExists = await fs.access(paths.logFile)
    expect(logFileExists).toBeUndefined()
  })

  test('codegen', async () => {
    const cmd = `node ${binPath} codegen --cwd="${testsCwd}"`

    // codegen
    const output = execSync(cmd + ' --cpu-prof', { cwd: testsCwd }).toString()
    expect(output.includes('the css function to author styles')).toBe(true)

    // Check that the `styled-system` folder was created
    const styledSystemExists = await fs.access(paths.styledSystem)
    expect(styledSystemExists).toBeUndefined()

    // Check that the `styled-system/jsx` was NOT created
    await expect(fs.access(path.resolve(paths.styledSystem, 'jsx'))).rejects.toThrow()

    // Check that the `.cpuprof` file was created
    const cpuProfPath = output.split('[cpu-prof]').pop()!.trim()!
    const cpuProfExists = await fs.access(cpuProfPath)
    expect(cpuProfExists).toBeUndefined()

    await fs.unlink(cpuProfPath)
  })

  test('cssgen', async () => {
    const cmd = `node ${binPath} cssgen --cwd="${testsCwd}"`

    // cssgen
    const output = execSync(cmd, { cwd: testsCwd }).toString()
    expect(output.includes('Successfully extracted css')).toBe(true)

    // Check that the `styled-system/styles.css` was created
    const stylesCssExists = await fs.access(path.resolve(paths.styledSystem, 'styles.css'))
    expect(stylesCssExists).toBeUndefined()

    // Check that using `lightningcss` is fine
    const output2 = execSync(cmd + ' --lightningcss', { cwd: testsCwd }).toString()
    expect(output2.includes('Successfully extracted css')).toBe(true)

    // Check that `--outfile` is fine
    const output3 = execSync(cmd + ' --outfile="./styles.css"', { cwd: testsCwd }).toString()
    expect(output3.includes('Successfully extracted css')).toBe(true)

    await fs.unlink(path.resolve(testsCwd, 'styles.css'))

    // Check that `--silent` is fine
    const output4 = execSync(cmd + ' --silent', { cwd: testsCwd }).toString()
    expect(output4.trim().length).toBe(0)
  })

  test('default', async () => {
    const cmd = `node ${binPath} --cwd="${testsCwd}"`

    // default
    const output = execSync(cmd, { cwd: testsCwd }).toString()
    expect(output.includes('Successfully extracted css')).toBe(true)

    // Check that the `styled-system` folder was created
    const styledSystemExists = await fs.access(paths.styledSystem)
    expect(styledSystemExists).toBeUndefined()

    // Check that the `styled-system/styles.css` was created
    const stylesCssExists = await fs.access(path.resolve(paths.styledSystem, 'styles.css'))
    expect(stylesCssExists).toBeUndefined()
  })

  test.skip('studio', async () => {
    const cmd = `node ${binPath} studio --cwd="${testsCwd}"`

    // studio
    const output = execSync(cmd + ' --build', { cwd: testsCwd }).toString()
    expect(output.includes('Complete!')).toBe(true)

    //   Check that the `styled-system-studio` folder was created
    const studioExists = await fs.access(paths.studio)
    expect(studioExists).toBeUndefined()
  })

  test('debug', async () => {
    const cmd = `node ${binPath} debug --cwd="${testsCwd}"`

    // debug
    const output = execSync(cmd, { cwd: testsCwd }).toString()
    expect(output.includes('files using Panda')).toBe(true)

    // Check that the `styled-system/debug` folder was created
    const debugExists = await fs.access(path.resolve(paths.styledSystem, 'debug'))
    expect(debugExists).toBeUndefined()

    // Check that the `styled-system/debug/config.json` file was created
    const debugConfigExists = await fs.access(path.resolve(paths.styledSystem, 'debug/config.json'))
    expect(debugConfigExists).toBeUndefined()
  })

  test('ship', async () => {
    const cmd = `node ${binPath} ship --cwd="${testsCwd}"`

    // ship
    const output = execSync(cmd, { cwd: testsCwd }).toString()
    expect(output.includes('files using Panda')).toBe(true)

    // Check that the `styled-system/panda.buildinfo.json` file was created
    const buildInfoExists = await fs.access(path.resolve(paths.styledSystem, 'panda.buildinfo.json'))
    expect(buildInfoExists).toBeUndefined()
  })

  test('emit-pkg', async () => {
    const cmd = `node ${binPath} emit-pkg --cwd="${testsCwd}"`

    // emit-pkg
    const output = execSync(cmd, { cwd: testsCwd }).toString()
    expect(output.includes('Emit package.json')).toBe(true)

    // Check that the `package.json` file was created
    const pkgExists = await fs.access(paths.pkgJson)
    expect(pkgExists).toBeUndefined()

    // Clean up
    await fs.unlink(paths.pkgJson)
  })
})
