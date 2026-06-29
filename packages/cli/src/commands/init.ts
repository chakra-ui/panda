import { defineCommand } from 'citty'
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { createNodeDriver } from '@pandacss/compiler'
import { findConfig } from '@pandacss/config'
import { baseArgs, parseCliFlags } from '../args'
import { initFlagsSchema } from '../schema'
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
import { configLoadDiagnostics } from '../diagnostics'
import type { InitFlags, InitResult, PhaseTimings } from '../schema'

/** Presets scaffolded into the generated config and installed by `panda init`. */
const DEFAULT_PRESETS = ['@pandacss/preset-base', '@pandacss/preset-panda'] as const

export const initCommand = defineCommand({
  meta: {
    name: 'init',
    description: "Initialize Panda's config file",
  },
  args: () => ({
    ...baseArgs(),
    force: { type: 'boolean', description: 'Overwrite an existing config file', alias: 'f' },
    postcss: { type: 'boolean', description: 'Emit a PostCSS config file', alias: 'p' },
    gitignore: { type: 'boolean', description: 'Update .gitignore with the output directory' },
    codegen: { type: 'boolean', description: 'Run codegen after setup' },
    outExtension: { type: 'string', description: 'Generated runtime file extension' },
    outdir: { type: 'string', description: 'Output directory for generated files' },
    jsxFramework: { type: 'string', description: 'The JSX framework to use' },
    syntax: { type: 'string', description: 'The CSS syntax preference' },
    strictTokens: { type: 'boolean', description: 'Set strictTokens to true' },
    install: {
      type: 'boolean',
      description: 'Install the default presets (use --no-install to skip)',
      default: true,
    },
    json: { type: 'boolean', description: 'Print JSON' },
    format: { type: 'string', description: 'Diagnostic output format: human, pretty, json, or github' },
    'log-level': {
      type: 'string',
      valueHint: 'level',
      description: 'Set output level: silent, error, warn, info, or debug',
    },
    logfile: { type: 'string', description: 'Write human output to a log file' },
  }),
  run: async ({ args }) => setExitCode(await runInit(parseCliFlags(initFlagsSchema, args))),
})

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
  let presetsInstalled: string[] = []

  // Decide once: presets are only referenced in the scaffold if we can actually install
  // them (a usable package.json exists and the user didn't opt out). Otherwise scaffold a
  // bare system so codegen still succeeds.
  const installedDeps = flags.install === false ? undefined : readInstalledDeps(cwd)
  const willInstall = flags.install !== false && installedDeps !== undefined

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
          presets: willInstall ? DEFAULT_PRESETS : [],
        }),
    })
    configPath = resolveConfigTarget(cwd, flags.config)

    if (flags.postcss) {
      postcssWritten = setupPostcss(cwd, flags.force)
    }

    if (flags.gitignore !== false) {
      gitignoreWritten = setupGitIgnore(cwd, outdir)
    }

    // Only install when we just scaffolded the config — re-running init on an existing
    // project must not impose deps. Presets must resolve before codegen loads the config.
    if (configWritten) {
      presetsInstalled = await timeAsync({
        timings,
        phase: 'install',
        run: async () =>
          setupDependencies(cwd, {
            optedOut: flags.install === false,
            deps: installedDeps,
            silent: flags.logLevel === 'silent',
            notify: shouldPrintHumanSummary(flags),
            output: commandOutput,
          }),
      })
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
    const diagnostics = configLoadDiagnostics(error, { cwd, file: flags.config })
    const result: InitResult = createResult({
      command: 'init',
      startedAt,
      data: {
        timings,
        configPath,
        outdir,
        configWritten,
        postcssWritten,
        gitignoreWritten,
        codegenFiles,
        presetsInstalled,
      },
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
    data: {
      timings,
      configPath,
      outdir,
      configWritten,
      postcssWritten,
      gitignoreWritten,
      codegenFiles,
      presetsInstalled,
    },
    diagnostics: [],
  })

  if (shouldPrintJson(flags)) {
    output.log(JSON.stringify(toJsonPayload(result), null, 2))
  } else {
    if (shouldPrintHumanSummary(flags)) {
      commandOutput.log(
        `init: ${configWritten ? 'wrote' : 'kept'} ${configPath}` +
          `${presetsInstalled.length > 0 ? `, installed ${presetsInstalled.join(', ')}` : ''}` +
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
  presets: readonly string[]
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
    `  presets: [${options.presets.map((name) => `'${name}'`).join(', ')}],`,
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

interface SetupDependenciesOptions {
  /** User passed `--no-install`. */
  optedOut: boolean
  /** Installed dep names, or `undefined` when there's no usable package.json. */
  deps: Set<string> | undefined
  silent?: boolean
  notify: boolean
  output: OutputSink
}

// Install presets as direct devDeps so the config's string specifiers resolve from the
// project root — a transitive dep of `@pandacss/dev` isn't reachable from cwd under pnpm.
function setupDependencies(cwd: string, options: SetupDependenciesOptions): string[] {
  if (options.optedOut) return []

  if (!options.deps) {
    // No usable package.json — the config was scaffolded bare, so tell the user what to add.
    if (options.notify) {
      options.output.log(
        `init: no usable package.json — scaffolded a bare config. install ${DEFAULT_PRESETS.join(
          ', ',
        )} and add them to \`presets\` for the default system.`,
      )
    }
    return []
  }

  const missing = DEFAULT_PRESETS.filter((name) => !options.deps?.has(name))
  if (missing.length === 0) return []

  const pm = detectPackageManager(cwd)
  try {
    execSync(installCommand(pm, missing), { cwd, stdio: options.silent ? 'ignore' : 'inherit' })
    return missing
  } catch {
    if (options.notify)
      options.output.log(`init: could not install ${missing.join(', ')} with ${pm}. Add them manually.`)
    return []
  }
}

function readInstalledDeps(cwd: string): Set<string> | undefined {
  try {
    const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    return new Set([...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})])
  } catch {
    return undefined
  }
}

type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'

const PACKAGE_MANAGERS: readonly PackageManager[] = ['npm', 'pnpm', 'yarn', 'bun']

function detectPackageManager(cwd: string): PackageManager {
  // corepack's `packageManager` field is authoritative when present.
  const declared = declaredPackageManager(cwd)
  if (declared) return declared

  let dir = resolve(cwd)
  while (true) {
    if (existsSync(join(dir, 'pnpm-lock.yaml'))) return 'pnpm'
    if (existsSync(join(dir, 'yarn.lock'))) return 'yarn'
    if (existsSync(join(dir, 'bun.lockb')) || existsSync(join(dir, 'bun.lock'))) return 'bun'
    if (existsSync(join(dir, 'package-lock.json'))) return 'npm'

    const parent = dirname(dir)
    if (parent === dir) return 'npm'
    dir = parent
  }
}

function declaredPackageManager(cwd: string): PackageManager | undefined {
  try {
    const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8')) as { packageManager?: string }
    const name = pkg.packageManager?.split('@')[0]
    return PACKAGE_MANAGERS.find((pm) => pm === name)
  } catch {
    return undefined
  }
}

function installCommand(pm: PackageManager, packages: string[]): string {
  const list = packages.join(' ')
  switch (pm) {
    case 'pnpm':
      return `pnpm add -D ${list}`
    case 'yarn':
      return `yarn add -D ${list}`
    case 'bun':
      return `bun add -d ${list}`
    default:
      return `npm install -D ${list}`
  }
}
