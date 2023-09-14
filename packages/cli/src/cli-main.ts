import { colors, logger } from '@pandacss/logger'
import {
  analyzeTokens,
  bundleCss,
  debugFiles,
  emitArtifacts,
  extractCss,
  generate,
  loadConfigAndCreateContext,
  setupConfig,
  setupGitIgnore,
  setupPostcss,
  shipFiles,
  writeAnalyzeJSON,
  type PandaContext,
} from '@pandacss/node'
import { compact } from '@pandacss/shared'
import { buildStudio, previewStudio, serveStudio } from '@pandacss/studio'
import { cac } from 'cac'
import { join, resolve } from 'pathe'
import { debounce } from 'perfect-debounce'
import updateNotifier from 'update-notifier'
import { name, version } from '../package.json'
import { cliInit } from './cli-init'
import type {
  AnalyzeCommandFlags,
  CodegenCommandFlags,
  CssGenCommandFlags,
  DebugCommandFlags,
  InitCommandFlags,
  MainCommandFlags,
  ShipCommandFlags,
  StudioCommandFlags,
} from './types'

export async function main() {
  updateNotifier({ pkg: { name, version }, distTag: 'latest' }).notify()

  const cli = cac('panda')

  const cwd = process.cwd()

  cli
    .command('init', "Initialize the panda's config file")
    .option('-i, --interactive', 'Run in interactive mode', { default: false })
    .option('-f, --force', 'Force overwrite existing config file')
    .option('-p, --postcss', 'Emit postcss config file')
    .option('-c, --config <path>', 'Path to panda config file')
    .option('--cwd <cwd>', 'Current working directory', { default: cwd })
    .option('--silent', 'Suppress all messages except errors')
    .option('--no-gitignore', "Don't update the .gitignore")
    .option('--out-extension <ext>', "The extension of the generated js files (default: 'mjs')")
    .option('--jsx-framework <framework>', 'The jsx framework to use')
    .option('--syntax <syntax>', 'The css syntax preference')
    .action(async (_flags: InitCommandFlags = {}) => {
      let options = {}

      if (_flags.interactive) {
        options = await cliInit()
      }

      const flags = { ..._flags, ...options }
      const { force, postcss, silent, gitignore, outExtension, jsxFramework, config: configPath, syntax } = flags

      const cwd = resolve(flags.cwd ?? '')

      if (silent) {
        logger.level = 'silent'
      }

      logger.info('cli', `Panda v${version}\n`)

      const done = logger.time.info('✨ Panda initialized')

      if (postcss) {
        await setupPostcss(cwd)
      }

      await setupConfig(cwd, { force, outExtension, jsxFramework, syntax })

      const ctx = await loadConfigAndCreateContext({ cwd, configPath })
      const { msg, box } = await emitArtifacts(ctx)

      if (gitignore) {
        setupGitIgnore(ctx)
      }

      logger.log(msg + box)

      done()
    })

  cli
    .command('codegen', 'Generate the panda system')
    .option('--silent', "Don't print any logs")
    .option('--clean', 'Clean the output directory before generating')
    .option('-c, --config <path>', 'Path to panda config file')
    .option('-w, --watch', 'Watch files and rebuild')
    .option('-p, --poll', 'Use polling instead of filesystem events when watching')
    .option('--cwd <cwd>', 'Current working directory', { default: cwd })
    .action(async (flags: CodegenCommandFlags) => {
      const { silent, clean, config: configPath, watch, poll } = flags

      const cwd = resolve(flags.cwd ?? '')

      if (silent) {
        logger.level = 'silent'
      }

      function loadContext() {
        return loadConfigAndCreateContext({ cwd, config: { clean }, configPath })
      }

      let ctx = await loadContext()

      const { msg } = await emitArtifacts(ctx)
      logger.log(msg)

      if (watch) {
        logger.info('ctx:watch', ctx.messages.configWatch())
        const watcher = ctx.runtime.fs.watch({
          include: ctx.dependencies,
          cwd,
          poll,
        })

        const onChange = debounce(async () => {
          logger.info('ctx:change', 'config changed, rebuilding...')
          ctx = await loadContext()
          await emitArtifacts(ctx)
          logger.info('ctx:updated', 'config rebuilt ✅')
        })

        watcher.on('change', onChange)
      }
    })

  cli
    .command('cssgen [glob]', 'Generate the css from files')
    .option('--silent', "Don't print any logs")
    .option('-m, --minify', 'Minify generated code')
    .option('--clean', 'Clean the chunks before generating')
    .option('-c, --config <path>', 'Path to panda config file')
    .option('-w, --watch', 'Watch files and rebuild')
    .option('-p, --poll', 'Use polling instead of filesystem events when watching')
    .option('-o, --outfile [file]', "Output file for extracted css, default to './styled-system/styles.css'")
    .option('--cwd <cwd>', 'Current working directory', { default: cwd })
    .action(async (maybeGlob?: string, flags: CssGenCommandFlags = {}) => {
      const { silent, clean, config: configPath, outfile, watch, poll, minify } = flags

      const cwd = resolve(flags.cwd ?? '')

      if (silent) {
        logger.level = 'silent'
      }

      function loadContext() {
        return loadConfigAndCreateContext({
          cwd,
          config: {
            clean,
            minify,
            ...(maybeGlob ? { include: [maybeGlob] } : undefined),
          },
          configPath,
        })
      }

      let ctx = await loadContext()

      const cssgen = async (ctx: PandaContext) => {
        if (outfile) {
          const outPath = resolve(cwd, outfile)

          const { msg } = await bundleCss(ctx, outPath)
          logger.info('css:emit', msg)
          //
        } else {
          //
          const { msg } = await extractCss(ctx)
          logger.info('css:emit', msg)
        }
      }

      await cssgen(ctx)

      if (watch) {
        logger.info('ctx:watch', ctx.messages.configWatch())
        const configWatcher = ctx.runtime.fs.watch({ include: ctx.dependencies, cwd, poll })

        configWatcher.on(
          'change',
          debounce(async () => {
            logger.info('ctx:change', 'config changed, rebuilding...')
            ctx = await loadContext()
            await cssgen(ctx)
            logger.info('ctx:updated', 'config rebuilt ✅')
          }),
        )

        const contentWatcher = ctx.runtime.fs.watch(ctx.config)
        contentWatcher.on(
          'all',
          debounce(async (event, file) => {
            logger.info(`file:${event}`, file)
            if (event === 'unlink') {
              ctx.project.removeSourceFile(ctx.runtime.path.abs(cwd, file))
            } else if (event === 'change') {
              ctx.project.reloadSourceFile(file)
              await cssgen(ctx)
            } else if (event === 'add') {
              ctx.project.createSourceFile(file)
              await cssgen(ctx)
            }
          }),
        )

        logger.info('ctx:watch', ctx.messages.watch())
      }
    })

  cli
    .command('[files]', 'Include file glob', { ignoreOptionDefaultValue: true })
    .option('-o, --outdir <dir>', 'Output directory', { default: 'styled-system' })
    .option('-m, --minify', 'Minify generated code')
    .option('-w, --watch', 'Watch files and rebuild')
    .option('-p, --poll', 'Use polling instead of filesystem events when watching')
    .option('-c, --config <path>', 'Path to panda config file')
    .option('--cwd <cwd>', 'Current working directory', { default: cwd })
    .option('--preflight', 'Enable css reset')
    .option('--silent', 'Suppress all messages except errors')
    .option('-e, --exclude <files>', 'Exclude files', { default: [] })
    .option('--clean', 'Clean output directory')
    .option('--hash', 'Hash the generated classnames to make them shorter')
    .option('--emitTokensOnly', 'Whether to only emit the `tokens` directory')
    .action(async (files: string[], flags: MainCommandFlags) => {
      const { config: configPath, silent, ...rest } = flags

      const cwd = resolve(flags.cwd)

      if (silent) {
        logger.level = 'silent'
      }

      const config = compact({ include: files, ...rest, cwd })
      await generate(config, configPath)
    })

  cli
    .command('studio', 'Realtime documentation for your design tokens')
    .option('--build', 'Build')
    .option('--preview', 'Preview')
    .option('-c, --config <path>', 'Path to panda config file')
    .option('--cwd <cwd>', 'Current working directory', { default: cwd })
    .option('--outdir', 'Output directory for static files')
    .action(async (flags: StudioCommandFlags) => {
      const { build, preview, outdir, config: configPath } = flags

      const cwd = resolve(flags.cwd ?? '')

      const ctx = await loadConfigAndCreateContext({
        cwd,
        configPath,
      })

      const outDir = resolve(outdir || ctx.studio.outdir)

      if (preview) {
        await previewStudio({ outDir })
      } else if (build) {
        await buildStudio({ outDir })
      } else {
        await serveStudio()

        const note = `use ${colors.reset(colors.bold('--build'))} to build`
        logger.log(colors.dim(`  ${colors.green('➜')}  ${colors.bold('Build')}: ${note}`))
      }
    })

  cli
    .command('analyze [glob]', 'Analyze design token usage in glob')
    .option('--json [filepath]', 'Output analyze report in JSON')
    .option('--silent', "Don't print any logs")
    .option('-c, --config <path>', 'Path to panda config file')
    .option('--cwd <cwd>', 'Current working directory', { default: cwd })
    .action(async (maybeGlob?: string, flags: AnalyzeCommandFlags = {}) => {
      const { silent, config: configPath } = flags

      const cwd = resolve(flags.cwd!)

      if (silent) {
        logger.level = 'silent'
      }

      const ctx = await loadConfigAndCreateContext({
        cwd,
        config: maybeGlob ? { include: [maybeGlob] } : undefined,
        configPath,
      })

      const result = analyzeTokens(ctx, {
        onResult(file) {
          logger.info('cli', `Analyzed ${colors.bold(file)}`)
        },
      })

      if (flags?.json && typeof flags.json === 'string') {
        await writeAnalyzeJSON(flags.json, result, ctx)
        logger.info('cli', `JSON report saved to ${flags.json}`)
        return
      }

      logger.info('cli', `Found ${result.details.byId.size} token used in ${result.details.byFilePathMaps.size} files`)
    })

  cli
    .command('debug [glob]', 'Debug design token extraction & css generated from files in glob')
    .option('--silent', "Don't print any logs")
    .option('--dry', 'Output debug files in stdout without writing to disk')
    .option('--outdir [dir]', "Output directory for debug files, default to './styled-system/debug'")
    .option('-c, --config <path>', 'Path to panda config file')
    .option('--cwd <cwd>', 'Current working directory', { default: cwd })
    .action(async (maybeGlob?: string, flags: DebugCommandFlags = {}) => {
      const { silent, dry = false, outdir: outdirFlag, config: configPath } = flags ?? {}

      const cwd = resolve(flags.cwd!)

      if (silent) {
        logger.level = 'silent'
      }

      const ctx = await loadConfigAndCreateContext({
        cwd,
        config: maybeGlob ? { include: [maybeGlob] } : undefined,
        configPath,
      })

      const outdir = outdirFlag ?? join(...ctx.paths.root, 'debug')

      await debugFiles(ctx, { outdir, dry })
    })

  cli
    .command('ship [glob]', 'Ship extract result from files in glob')
    .option('--silent', "Don't print any logs")
    .option(
      '--o, --outfile [file]',
      "Output path for the build info file, default to './styled-system/panda.buildinfo.json'",
    )
    .option('-m, --minify', 'Minify generated JSON file')
    .option('-c, --config <path>', 'Path to panda config file')
    .option('--cwd <cwd>', 'Current working directory', { default: cwd })
    .action(async (maybeGlob?: string, flags: ShipCommandFlags = {}) => {
      const { silent, outfile: outfileFlag, minify, config: configPath } = flags

      const cwd = resolve(flags.cwd!)

      if (silent) {
        logger.level = 'silent'
      }

      const ctx = await loadConfigAndCreateContext({
        cwd,
        config: maybeGlob ? { include: [maybeGlob] } : undefined,
        configPath,
      })

      const outfile = outfileFlag ?? join(...ctx.paths.root, 'panda.buildinfo.json')

      if (minify) {
        ctx.config.minify = true
      }

      await shipFiles(ctx, outfile)
    })

  cli.help()

  cli.version(version)

  cli.parse(process.argv, { run: false })

  try {
    await cli.runMatchedCommand()
  } catch (error) {
    logger.error('cli', error)

    if (logger.isDebug) {
      console.error(error)
    }

    process.exit(1)
  }
}
