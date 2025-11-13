import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import fs from 'node:fs/promises'
import { afterAll } from 'vitest'
import { beforeAll } from 'vitest'

// Helper to run command and capture output even if it fails
function runCommand(cmd: string, options: any) {
  const opts = { ...options, encoding: 'utf8', env: { ...process.env, NO_COLOR: '1' } }
  try {
    return execSync(cmd, opts).toString()
  } catch (error: any) {
    // If command fails, still return the output (stdout + stderr)
    const stdout = error.stdout ? error.stdout.toString() : ''
    const stderr = error.stderr ? error.stderr.toString() : ''
    const output = stdout + stderr

    // Debug: log first 200 chars of output if test is failing
    if (process.env.DEBUG_CLI_TEST) {
      console.log('Command failed:', cmd)
      console.log('Output (first 200 chars):', output.slice(0, 200))
      console.log('stdout length:', stdout.length, 'stderr length:', stderr.length)
    }

    if (output) return output
    throw error
  }
}

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
    const output = runCommand(cmd, { cwd: testsCwd })
    // Check for either "Thanks" (new config) or existing config message
    expect(output.includes('Thanks') || output.includes('It looks like you already have panda created')).toBe(true)

    // Check if the config file was created
    const configFileExists = await fs.access(paths.config)
    expect(configFileExists).toBeUndefined()

    // init on existing project
    const output2 = runCommand(cmd, { cwd: testsCwd })
    expect(output2.includes('It looks like you already have panda created')).toBe(true)

    // init with --force
    const output3 = runCommand(cmd + ' --force --postcss --logfile="./panda.log"', { cwd: testsCwd })
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
    const output = runCommand(cmd + ' --cpu-prof', { cwd: testsCwd })
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
    const output = runCommand(cmd, { cwd: testsCwd })
    expect(output.includes('Successfully extracted css')).toBe(true)

    // Check that the `styled-system/styles.css` was created
    const stylesCssExists = await fs.access(path.resolve(paths.styledSystem, 'styles.css'))
    expect(stylesCssExists).toBeUndefined()

    // Check that using `lightningcss` is fine
    const output2 = runCommand(cmd + ' --lightningcss', { cwd: testsCwd })
    expect(output2.includes('Successfully extracted css')).toBe(true)

    // Check that `--outfile` is fine
    const output3 = runCommand(cmd + ' --outfile="./styles.css"', { cwd: testsCwd })
    expect(output3.includes('Successfully extracted css')).toBe(true)

    await fs.unlink(path.resolve(testsCwd, 'styles.css'))

    // Check that `--silent` is fine
    const output4 = runCommand(cmd + ' --silent', { cwd: testsCwd })
    expect(output4.trim().length).toBe(0)
  })

  test('default', async () => {
    const cmd = `node ${binPath} --cwd="${testsCwd}"`

    // default
    const output = runCommand(cmd, { cwd: testsCwd })
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
    const output = runCommand(cmd + ' --build', { cwd: testsCwd })
    expect(output.includes('Complete!')).toBe(true)

    //   Check that the `styled-system-studio` folder was created
    const studioExists = await fs.access(paths.studio)
    expect(studioExists).toBeUndefined()
  })

  test('debug', async () => {
    const cmd = `node ${binPath} debug --cwd="${testsCwd}"`

    // debug
    const output = runCommand(cmd, { cwd: testsCwd })
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
    const output = runCommand(cmd, { cwd: testsCwd })
    expect(output.includes('files using Panda')).toBe(true)

    // Check that the `styled-system/panda.buildinfo.json` file was created
    const buildInfoExists = await fs.access(path.resolve(paths.styledSystem, 'panda.buildinfo.json'))
    expect(buildInfoExists).toBeUndefined()
  })

  test('emit-pkg', async () => {
    const cmd = `node ${binPath} emit-pkg --cwd="${testsCwd}"`

    // emit-pkg
    const output = runCommand(cmd, { cwd: testsCwd })
    expect(output.includes('Emit package.json')).toBe(true)

    // Check that the `package.json` file was created
    const pkgExists = await fs.access(paths.pkgJson)
    expect(pkgExists).toBeUndefined()

    // Clean up
    await fs.unlink(paths.pkgJson)
  })
})
