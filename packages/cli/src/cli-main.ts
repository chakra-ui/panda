import { colors, logger } from '@pandacss/logger'
import {
  analyzeTokens,
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
} from '@pandacss/node'
import { compact } from '@pandacss/shared'
import { buildStudio, previewStudio, serveStudio } from '@pandacss/studio'
import { cac } from 'cac'
import { join, resolve } from 'pathe'
import { debounce } from 'perfect-debounce'
import updateNotifier from 'update-notifier'
import { name, version } from '../package.json'

export async function main() {
  updateNotifier({ pkg: { name, version }, distTag: 'latest' }).notify()

  const cli = cac('panda')

  const cwd = process.cwd()

  cli
    .command('init', "Initialize the panda's config file")
    .option('-f, --force', 'Force overwrite existing config file')
    .option('-p, --postcss', 'Emit postcss config file')
    .option('-c, --config <path>', 'Path to panda config file')
    .option('--cwd <cwd>', 'Current working directory', { default: cwd })
    .option('--silent', 'Suppress all messages except errors')
    .option('--no-gitignore', "Don't update the .gitignore")
    .option('--out-extension <ext>', "The extension of the generated js files (default: 'mjs')")
    .option('--jsx-framework <framework>', 'The jsx framework to use')
    .option('--syntax <syntax>', 'The css syntax preference')
    .action(async (flags) => {
      const { force, postcss, silent, gitignore, outExtension, jsxFramework, config: configPath, syntax } = flags

      const cwd = resolve(flags.cwd)

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
      const msg = await emitArtifacts(ctx)

      if (gitignore) {
        setupGitIgnore(ctx)
      }

      logger.log(msg)

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
    .action(async (flags) => {
      const { silent, clean, configPath, watch, poll } = flags

      const cwd = resolve(flags.cwd)

      if (silent) {
        logger.level = 'silent'
      }

      function loadContext() {
        return loadConfigAndCreateContext({ cwd, config: { clean }, configPath })
      }

      let ctx = await loadContext()

      const msg = await emitArtifacts(ctx)
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
    .command('cssgen', 'Generate the css from files')
    .option('--silent', "Don't print any logs")
    .option('--clean', 'Clean the chunks before generating')
    .option('-c, --config <path>', 'Path to panda config file')
    .option('--cwd <cwd>', 'Current working directory', { default: cwd })
    .action(async (flags) => {
      const { silent, clean, config: configPath } = flags

      const cwd = resolve(flags.cwd)

      if (silent) {
        logger.level = 'silent'
      }

      const ctx = await loadConfigAndCreateContext({
        cwd,
        configPath,
      })

      if (clean) {
        ctx.chunks.empty()
      }

      const msg = await extractCss(ctx)

      logger.log(msg)
    })

  cli
    .command('[files]', 'Include file glob', {
      ignoreOptionDefaultValue: true,
    })
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
    .action(async (files: string[], flags) => {
      const { config: configPath, silent, ...rest } = flags

      const cwd = resolve(flags.cwd)

      if (silent) {
        logger.level = 'silent'
      }

      const config = compact({ include: files, cwd, ...rest })
      await generate(config, configPath)
    })

  cli
    .command('studio', 'Realtime documentation for your design tokens')
    .option('--build', 'Build')
    .option('--preview', 'Preview')
    .option('-c, --config <path>', 'Path to panda config file')
    .option('--cwd <cwd>', 'Current working directory', { default: cwd })
    .option('--outdir', 'Output directory for static files')
    .action(async (flags) => {
      const { build, preview, outdir, config: configPath } = flags

      const cwd = resolve(flags.cwd)

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
    .action(async (maybeGlob?: string, flags: { silent?: boolean; json?: string; cwd?: string } = {}) => {
      const { silent } = flags

      const cwd = resolve(flags.cwd!)

      if (silent) {
        logger.level = 'silent'
      }

      const ctx = await loadConfigAndCreateContext({
        cwd,
        config: maybeGlob ? { include: [maybeGlob] } : undefined,
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
    .action(
      async (maybeGlob?: string, flags: { silent?: boolean; dry?: boolean; outdir?: string; cwd?: string } = {}) => {
        const { silent, dry = false, outdir: outdirFlag } = flags ?? {}

        const cwd = resolve(flags.cwd!)

        if (silent) {
          logger.level = 'silent'
        }

        const ctx = await loadConfigAndCreateContext({
          cwd,
          config: maybeGlob ? { include: [maybeGlob] } : undefined,
        })

        const outdir = outdirFlag ?? join(...ctx.paths.root, 'debug')

        await debugFiles(ctx, { outdir, dry })
      },
    )

  cli
    .command('ship [glob]', 'Ship extract result from files in glob')
    .option('--silent', "Don't print any logs")
    .option('--outfile [file]', "Output directory for shipped files, default to './styled-system/panda.json'")
    .option('-m, --minify', 'Minify generated JSON file')
    .option('-c, --config <path>', 'Path to panda config file')
    .option('--cwd <cwd>', 'Current working directory', { default: cwd })
    .action(
      async (
        maybeGlob?: string,
        flags: { silent?: boolean; minify?: boolean; outfile?: string; cwd?: string } = {},
      ) => {
        const { silent, outfile: outfileFlag, minify } = flags

        const cwd = resolve(flags.cwd!)

        if (silent) {
          logger.level = 'silent'
        }

        const ctx = await loadConfigAndCreateContext({
          cwd,
          config: maybeGlob ? { include: [maybeGlob] } : undefined,
        })

        const outfile = outfileFlag ?? join(...ctx.paths.root, 'panda.json')

        if (minify) {
          ctx.config.minify = true
        }

        await shipFiles(ctx, outfile)
      },
    )

  cli.help()

  cli.version(version)

  cli.parse(process.argv, { run: false })
  await cli.runMatchedCommand()
}
