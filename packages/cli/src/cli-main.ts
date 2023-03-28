import { findConfigFile } from '@pandacss/config'
import { colors, logger } from '@pandacss/logger'
import {
  analyzeTokens,
  emitArtifacts,
  extractCss,
  generate,
  loadConfigAndCreateContext,
  setupConfig,
  setupGitIgnore,
  setupPostcss,
  writeAnalyzeJSON,
} from '@pandacss/node'
import { compact } from '@pandacss/shared'
import { cac } from 'cac'
import { readFileSync } from 'fs'
import path, { join } from 'path'
import updateNotifier from 'update-notifier'
import packageJson from '../package.json' assert { type: 'json' }
import { buildStudio, previewStudio, serveStudio } from './studio'

export async function main() {
  const cli = cac('panda')

  const cwd = process.cwd()
  const pkgPath = join(__dirname, '../package.json')
  const pkgJson = JSON.parse(readFileSync(pkgPath, 'utf8'))

  cli
    .command('init', "Initialize the panda's config file")
    .option('-f, --force', 'Force overwrite existing config file')
    .option('-p, --postcss', 'Emit postcss config file')
    .option('--silent', 'Suppress all messages except errors')
    .option('--no-gitignore', "Don't update the .gitignore")
    .action(async (flags) => {
      const { force, postcss, silent, gitignore } = flags

      if (silent) {
        logger.level = 'silent'
      }

      logger.info('cli', `Panda v${pkgJson.version}\n`)

      const done = logger.time.info('✨ Panda initialized')

      if (postcss) await setupPostcss(cwd)
      await setupConfig(cwd, { force })

      const ctx = await loadConfigAndCreateContext()
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
    .action(async (flags) => {
      const { silent, clean } = flags

      if (silent) logger.level = 'silent'

      const ctx = await loadConfigAndCreateContext({ config: { clean } })
      const msg = await emitArtifacts(ctx)

      logger.log(msg)
    })

  cli
    .command('cssgen', 'Generate the css from files')
    .option('--silent', "Don't print any logs")
    .option('--clean', 'Clean the chunks before generating')
    .action(async (flags) => {
      const { silent, clean } = flags
      if (silent) logger.level = 'silent'

      const ctx = await loadConfigAndCreateContext()
      if (clean) ctx.chunks.empty()

      const msg = await extractCss(ctx)

      logger.log(msg)
    })

  cli
    .command('[files]', 'Include file glob', {
      ignoreOptionDefaultValue: true,
    })
    .option('-o, --outdir <dir>', 'Output directory', { default: 'panda' })
    .option('-m, --minify', 'Minify generated code')
    .option('--cwd <cwd>', 'Current working directory', { default: process.cwd() })
    .option('-w, --watch', 'Watch files and rebuild')
    .option('-p, --poll', 'Use polling instead of filesystem events when watching')
    .option('-c, --config <path>', 'Path to panda config file')
    .option('--preflight', 'Enable css reset')
    .option('--silent', 'Suppress all messages except errors')
    .option('-e, --exclude <files>', 'Exclude files', { default: [] })
    .option('--clean', 'Clean output directory')
    .option('--hash', 'Hash the generated classnames to make them shorter')
    .action(async (files: string[], flags) => {
      const { config: configPath, silent, ...rest } = flags
      if (silent) logger.level = 'silent'

      const options = compact({ include: files, ...rest })
      logger.debug('cli', options)
      await generate(options, configPath)
    })

  cli
    .command('studio', 'Realtime documentation for your design tokens')
    .option('--build', 'Build')
    .option('--preview', 'Preview')
    .option('--outdir', 'Output directory for static files')
    .action(async (flags) => {
      const { build, preview, outdir } = flags
      const outDir = outdir || path.join(process.cwd(), 'panda-static')

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
    .command('analyze [path]', 'Anaylyze design token usage in path')
    .option('--json [filepath]', 'Output analyze report in JSON')
    // .option('--html [dir]', 'Output analyze report in interactive web page')
    .option('--silent', "Don't print any logs")
    .option('--only', "Only analyze given filepath, skip config's include/exclude")
    .action(
      async (
        maybePath?: string,
        flags?: { silent?: boolean; json?: string; html?: string; mode?: ParserMode; only?: boolean },
      ) => {
        const { silent, only } = flags ?? {}
        if (silent) logger.level = 'silent'

        const configPath = (maybePath && findConfigFile({ cwd: maybePath })) ?? undefined
        const cwd = configPath ? path.dirname(configPath) : maybePath ?? process.cwd()

        const ctx = await loadConfigAndCreateContext({
          cwd,
          configPath,
          config: only ? { include: [maybePath] } : (undefined as any),
        })
        logger.info('cli', `Found config at ${colors.bold(ctx.path)}]`)

        const result = analyzeTokens(ctx, {
          onResult: (file) => {
            logger.info('cli', `Analyzed ${colors.bold(file)}`)
          },
        })

        logger.info('cli', result.counts)
        const { mostUseds, ...stats } = result.stats
        logger.info('cli', stats)
        logger.info('cli', mostUseds)

        if (flags?.json && typeof flags.json === 'string') {
          await writeAnalyzeJSON(flags.json, result, ctx)

          logger.info('cli', `JSON report saved to ${flags.json}`)
          return
        }

        // single file bundle is not supported yet
        // if (flags?.html && typeof flags.html === 'string') {
        //   return
        // }

        logger.info(
          'cli',
          `Found ${result.details.byId.size} token used in ${result.details.byFilePathMaps.size} files`,
        )
      },
    )

  cli.help()

  cli.version(pkgJson.version)

  cli.parse(process.argv, { run: false })
  await cli.runMatchedCommand()

  updateNotifier({ pkg: packageJson, distTag: 'dev' }).notify()
}

type ParserMode = NonNullable<Parameters<typeof analyzeTokens>[1]>['mode']
