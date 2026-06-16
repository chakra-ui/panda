import { defineCommand } from 'citty'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { createNodeDriver } from '@pandacss/compiler'
import { findConfig } from '@pandacss/config'
import {
  consoleOutput,
  createCommandOutput,
  renderCommandDiagnostics,
  resolveCwd,
  shouldPrintHumanSummary,
  shouldPrintJson,
  type OutputSink,
} from '../output'
import { createResult, setExitCode, toJsonPayload } from '../result'
import { renderTimings, timeAsync } from '../timing'
import { configLoadDiagnostic } from '../diagnostics'
import type { CommandContext, InitFlags, InitResult, PhaseTimings } from '../types'

export function initCommand(ctx: CommandContext) {
  return defineCommand({
    meta: {
      name: 'init',
      description: "Initialize Panda's config file",
    },
    args: {
      cwd: { type: 'string', description: 'Current working directory', default: ctx.cwd },
      config: { type: 'string', description: 'Path to panda config file', alias: 'c' },
      force: { type: 'boolean', description: 'Overwrite an existing config file', alias: 'f' },
      postcss: { type: 'boolean', description: 'Emit a PostCSS config file', alias: 'p' },
      gitignore: { type: 'boolean', description: 'Update .gitignore with the output directory' },
      codegen: { type: 'boolean', description: 'Run codegen after setup' },
      outExtension: { type: 'string', description: 'Generated runtime file extension' },
      outdir: { type: 'string', description: 'Output directory for generated files' },
      jsxFramework: { type: 'string', description: 'The JSX framework to use' },
      syntax: { type: 'string', description: 'The CSS syntax preference' },
      strictTokens: { type: 'boolean', description: 'Set strictTokens to true' },
      silent: { type: 'boolean', description: 'Suppress all messages except errors' },
      json: { type: 'boolean', description: 'Print JSON' },
      format: { type: 'string', description: 'Diagnostic output format: human, pretty, json, or github' },
      logfile: { type: 'string', description: 'Write human output to a log file' },
    },
    run: async ({ args }) => setExitCode(await runInit(args as InitFlags)),
  })
}

export async function runInit(flags: InitFlags = {}, output: OutputSink = consoleOutput): Promise<InitResult> {
  const startedAt = performance.now()
  const cwd = resolveCwd(flags.cwd)
  const commandOutput = createCommandOutput(output, flags, cwd)
  const timings: PhaseTimings = {}
  const outdir = flags.outdir ?? 'styled-system'

  let configPath = resolveConfigTarget(cwd, flags.config)
  let configWritten = false
  let postcssWritten = false
  let gitignoreWritten = false
  let codegenFiles: string[] = []

  try {
    configWritten = await timeAsync({
      timings,
      phase: 'config',
      run: () =>
        setupConfig(cwd, {
          configPath,
          force: flags.force,
          outdir,
          outExtension: flags.outExtension,
          jsxFramework: flags.jsxFramework,
          syntax: flags.syntax,
          strictTokens: flags.strictTokens,
        }),
    })
    configPath = resolveConfigTarget(cwd, flags.config)

    if (flags.postcss) {
      postcssWritten = setupPostcss(cwd, flags.force)
    }

    if (flags.gitignore !== false) {
      gitignoreWritten = setupGitIgnore(cwd, outdir)
    }

    if (flags.codegen !== false) {
      const driver = await timeAsync({
        timings,
        phase: 'codegen',
        run: () => createNodeDriver({ cwd, configPath: flags.config }),
      })
      codegenFiles = driver.codegen({ outdir: flags.outdir })
    }
  } catch (error) {
    const diagnostics = [configLoadDiagnostic(error, { cwd, file: flags.config })]
    const result: InitResult = createResult({
      command: 'init',
      startedAt,
      data: { timings, configPath, outdir, configWritten, postcssWritten, gitignoreWritten, codegenFiles },
      diagnostics,
      ok: false,
    })

    if (shouldPrintJson(flags)) {
      output.log(JSON.stringify(toJsonPayload(result), null, 2))
    } else {
      renderCommandDiagnostics(diagnostics, commandOutput, flags, cwd)
      renderTimings({ command: 'init', timings, output: commandOutput, flags })
    }

    return result
  }

  const result: InitResult = createResult({
    command: 'init',
    startedAt,
    data: { timings, configPath, outdir, configWritten, postcssWritten, gitignoreWritten, codegenFiles },
    diagnostics: [],
  })

  if (shouldPrintJson(flags)) {
    output.log(JSON.stringify(toJsonPayload(result), null, 2))
  } else {
    if (shouldPrintHumanSummary(flags)) {
      commandOutput.log(
        `init: ${configWritten ? 'wrote' : 'kept'} ${configPath}` +
          `${gitignoreWritten ? ', updated .gitignore' : ''}` +
          `${codegenFiles.length > 0 ? `, wrote ${codegenFiles.length} codegen files` : ''}`,
      )
    }
    renderTimings({ command: 'init', timings, output: commandOutput, flags })
  }

  return result
}

interface SetupConfigOptions {
  configPath: string
  force?: boolean
  outdir: string
  outExtension?: 'ts' | 'js' | 'mjs'
  jsxFramework?: string
  syntax?: 'template-literal' | 'object-literal'
  strictTokens?: boolean
}

async function setupConfig(_cwd: string, options: SetupConfigOptions): Promise<boolean> {
  if (existsSync(options.configPath) && !options.force) return false

  mkdirSync(dirname(options.configPath), { recursive: true })
  writeFileSync(options.configPath, configSource(options))
  return true
}

function setupPostcss(cwd: string, force?: boolean): boolean {
  const file = join(cwd, 'postcss.config.cjs')
  if (existsSync(file) && !force) return false

  writeFileSync(
    file,
    `module.exports = {
  plugins: {
    '@pandacss/dev/postcss': {},
  },
}
`,
  )
  return true
}

export function setupGitIgnore(cwd: string, outdir = 'styled-system'): boolean {
  const file = findGitIgnore(cwd) ?? join(cwd, '.gitignore')
  const content = existsSync(file) ? readFileSync(file, 'utf8') : ''

  if (hasGitignoreEntry(content, outdir)) return false

  const prefix = content.length > 0 && !content.endsWith('\n') ? '\n\n' : content.length > 0 ? '\n' : ''
  writeFileSync(file, `${content}${prefix}# Panda\n${outdir}\n`)
  return true
}

function resolveConfigTarget(cwd: string, configPath?: string): string {
  if (configPath) return resolve(cwd, configPath)

  try {
    return findConfig({ cwd })
  } catch {
    return join(cwd, 'panda.config.ts')
  }
}

function findGitIgnore(cwd: string): string | undefined {
  let dir = resolve(cwd)

  while (true) {
    const file = join(dir, '.gitignore')
    if (existsSync(file)) return file

    const parent = dirname(dir)
    if (parent === dir) return undefined
    dir = parent
  }
}

function hasGitignoreEntry(content: string, outdir: string): boolean {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .some((line) => line === outdir)
}

function configSource(options: SetupConfigOptions): string {
  const lines = [
    "import { defineConfig } from '@pandacss/dev'",
    '',
    'export default defineConfig({',
    `  presets: ['@pandacss/preset-base', '@pandacss/preset-panda'],`,
    '  preflight: true,',
    `  include: ['./src/**/*.{js,jsx,ts,tsx}', './pages/**/*.{js,jsx,ts,tsx}'],`,
    '  exclude: [],',
    '  theme: {',
    '    extend: {},',
    '  },',
    `  outdir: ${JSON.stringify(options.outdir)},`,
  ]

  if (options.outExtension) lines.push(`  outExtension: ${JSON.stringify(options.outExtension)},`)
  if (options.jsxFramework) lines.push(`  jsxFramework: ${JSON.stringify(options.jsxFramework)},`)
  if (options.syntax) lines.push(`  syntax: ${JSON.stringify(options.syntax)},`)
  if (options.strictTokens) lines.push('  strictTokens: true,')

  lines.push('})', '')

  return lines.join('\n')
}
