import { findConfigFile } from '@pandacss/config'
import { colors, logger } from '@pandacss/logger'
import {
  PandaContext,
  analyzeTokens,
  debugFiles,
  emitArtifacts,
  generate,
  loadConfigAndCreateContext,
  setupConfig,
  setupGitIgnore,
  setupPostcss,
  shipFiles,
  writeAnalyzeJSON,
  type CssArtifactType,
} from '@pandacss/node'
import { compact } from '@pandacss/shared'
import { cac } from 'cac'
import { join, resolve } from 'pathe'
import { debounce } from 'perfect-debounce'
import { version } from '../package.json'
import { interactive } from './interactive'
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
    .option('--strict-tokens', 'Using strictTokens: true')
    .action(async (initFlags: Partial<InitCommandFlags> = {}) => {
      let options = {}

      if (initFlags.interactive) {
        options = await interactive()
      }

      const flags = { ...initFlags, ...options }
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

      const ctx = await loadConfigAndCreateContext({ cwd, config: { clean }, configPath })

      const { msg } = await emitArtifacts(ctx)
      logger.log(msg)

      if (watch) {
        logger.info('ctx:watch', ctx.messages.configWatch())

        const watcher = ctx.runtime.fs.watch({
          include: ctx.conf.dependencies,
          cwd,
          poll,
        })

        const onChange = debounce(async () => {
          logger.info('ctx:change', 'config changed, rebuilding...')
          // in the codegen, we don't need to create a new panda context
          const affecteds = await ctx.diff.reloadConfigAndRefreshContext()
          await emitArtifacts(ctx, Array.from(affecteds.artifacts))
          logger.info('ctx:updated', 'config rebuilt ✅')
        })

        watcher.on('change', onChange)
      }
    })

  cli
    .command(
      'cssgen [globOrType]',
      'Generate the css from files, or generate the css from the specified type which can be: preflight, tokens, static, global, keyframes',
    )
    .option('--silent', "Don't print any logs")
    .option('-m, --minify', 'Minify generated code')
    .option('--clean', 'Clean the output before generating')
    .option('-c, --config <path>', 'Path to panda config file')
    .option('-w, --watch', 'Watch files and rebuild')
    .option('--minimal', 'Do not include CSS generation for theme tokens, preflight, keyframes, static and global css')
    .option('-p, --poll', 'Use polling instead of filesystem events when watching')
    .option('-o, --outfile [file]', "Output file for extracted css, default to './styled-system/styles.css'")
    .option('--cwd <cwd>', 'Current working directory', { default: cwd })
    .action(async (maybeGlob?: string, flags: CssGenCommandFlags = {}) => {
      const { silent, clean, config: configPath, outfile, watch, poll, minify, minimal } = flags

      const cwd = resolve(flags.cwd ?? '')

      const cssArtifact = ['preflight', 'tokens', 'static', 'global', 'keyframes'].find(
        (type) => type === maybeGlob,
      ) as CssArtifactType | undefined

      const glob = cssArtifact ? undefined : maybeGlob

      if (silent) {
        logger.level = 'silent'
      }

      const overrideConfig = {
        clean,
        minify,
        optimize: true,
        ...(glob ? { include: [glob] } : undefined),
      }

      let ctx = await loadConfigAndCreateContext({
        cwd,
        config: overrideConfig,
        configPath,
      })

      const ensureFile = (ctx: PandaContext, file: string) => {
        const outPath = resolve(cwd, file)
        const dirname = ctx.runtime.path.dirname(outPath)
        ctx.runtime.fs.ensureDirSync(dirname)
      }

      const cssgen = async (ctx: PandaContext) => {
        //
        if (cssArtifact) {
          //
          ctx.appendCss(cssArtifact)

          if (outfile) {
            ensureFile(ctx, outfile)
            ctx.runtime.fs.writeFileSync(outfile, ctx.getCss())
          } else {
            await ctx.writeCss()
          }

          const msg = ctx.messages.cssArtifactComplete(cssArtifact)
          logger.info('css:emit:artifact', msg)
          //
        } else {
          //
          if (!minimal) {
            ctx.appendLayerParams()
            ctx.appendBaselineCss()
          }

          const files = ctx.appendFilesCss()

          if (outfile) {
            ensureFile(ctx, outfile)
            ctx.runtime.fs.writeFileSync(outfile, ctx.getCss())
          } else {
            await ctx.writeCss()
          }

          const msg = ctx.messages.buildComplete(files.length)
          logger.info('css:emit:out', msg)
        }
      }

      await cssgen(ctx)

      if (watch) {
        logger.info('ctx:watch', ctx.messages.configWatch())
        const configWatcher = ctx.runtime.fs.watch({ include: ctx.conf.dependencies, cwd, poll })

        configWatcher.on(
          'change',
          debounce(async () => {
            logger.info('ctx:change', 'config changed, rebuilding...')
            await ctx.diff.reloadConfigAndRefreshContext((conf) => {
              ctx = new PandaContext({ ...conf, hooks: ctx.hooks })
            })
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
    .option('--port <port>', 'Port')
    .option('--host', 'Host')
    .option('-c, --config <path>', 'Path to panda config file')
    .option('--cwd <cwd>', 'Current working directory', { default: cwd })
    .option('--outdir', 'Output directory for static files')
    .action(async (flags: StudioCommandFlags) => {
      const { build, preview, port, host, outdir, config } = flags

      const cwd = resolve(flags.cwd ?? '')

      const ctx = await loadConfigAndCreateContext({
        cwd,
        configPath: config,
      })

      const buildOpts = {
        configPath: findConfigFile({ cwd, file: config })!,
        outDir: resolve(outdir || ctx.studio.outdir),
        port,
        host,
      }

      let studio: any

      try {
        const studioPath = require.resolve('@pandacss/studio', { paths: [cwd] })
        studio = require(studioPath)
      } catch (error) {
        logger.error('studio', error)
        throw new Error("You need to install '@pandacss/studio' to use this command")
      }

      if (preview) {
        await studio.previewStudio(buildOpts)
      } else if (build) {
        await studio.buildStudio(buildOpts)
      } else {
        await studio.serveStudio(buildOpts)

        const note = `use ${colors.reset(colors.bold('--build'))} to build`
        const port = `use ${colors.reset(colors.bold('--port'))} for a different port`
        logger.log(colors.dim(`  ${colors.green('➜')}  ${colors.bold('Build')}: ${note}`))
        logger.log(colors.dim(`  ${colors.green('➜')}  ${colors.bold('Port')}: ${port}`))
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
    .option('--only-config', "Should only output the config file, default to 'false'")
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

      await debugFiles(ctx, { outdir, dry, onlyConfig: flags.onlyConfig })
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
    .option('-w, --watch', 'Watch files and rebuild')
    .option('-p, --poll', 'Use polling instead of filesystem events when watching')
    .action(async (maybeGlob?: string, flags: ShipCommandFlags = {}) => {
      const { silent, outfile: outfileFlag, minify, config: configPath, watch, poll } = flags

      const cwd = resolve(flags.cwd!)

      if (silent) {
        logger.level = 'silent'
      }

      let ctx = await loadConfigAndCreateContext({
        cwd,
        config: maybeGlob ? { include: [maybeGlob] } : undefined,
        configPath,
      })

      const outfile = outfileFlag ?? join(...ctx.paths.root, 'panda.buildinfo.json')

      if (minify) {
        ctx.config.minify = true
      }

      await shipFiles(ctx, outfile)

      if (watch) {
        logger.info('ctx:watch', ctx.messages.configWatch())
        const configWatcher = ctx.runtime.fs.watch({ include: ctx.conf.dependencies, cwd, poll })

        configWatcher.on(
          'change',
          debounce(async () => {
            logger.info('ctx:change', 'config changed, rebuilding...')
            await ctx.diff.reloadConfigAndRefreshContext((conf) => {
              ctx = new PandaContext({ ...conf, hooks: ctx.hooks })
            })
            await shipFiles(ctx, outfile)
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
              await shipFiles(ctx, outfile)
            } else if (event === 'add') {
              ctx.project.createSourceFile(file)
              await shipFiles(ctx, outfile)
            }
          }),
        )

        logger.info('ctx:watch', ctx.messages.watch())
      }
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
