import type { BoxNodeEmptyInitializer, BoxNodeLiteral, BoxNodeMap } from '@box-extractor/core'
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
} from '@pandacss/node'
import { compact } from '@pandacss/shared'
import type { ResultItem } from '@pandacss/types'
import { cac } from 'cac'
import { readFileSync } from 'fs'
import { writeFile } from 'fs/promises'
import path, { join } from 'path'
import { Node } from 'ts-morph'
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
    .option('--html [dir]', 'Output analyze report in interactive web page')
    .option('--silent', "Don't print any logs")
    .option('--only', "Only analyze given filepath, skip config's include/exclude")
    .option('--mode [mode]', 'box-extractor || internal')
    .action(
      async (
        maybePath?: string,
        flags?: { silent?: boolean; json?: string; html?: string; mode?: ParserMode; only?: boolean },
      ) => {
        const { silent, mode = 'internal', only } = flags ?? {}
        if (silent) logger.level = 'silent'

        const configPath = (maybePath && findConfigFile({ cwd: maybePath })) ?? undefined
        const cwd = configPath ? path.dirname(configPath) : maybePath ?? process.cwd()

        const ctx = await loadConfigAndCreateContext({
          cwd,
          configPath,
          config: only ? { include: [maybePath] } : (undefined as any),
        })
        logger.info('cli', `Found config at ${colors.bold(ctx.path)}, using mode=[${colors.bold(mode)}]`)
        // console.log(ctx.jsx, ctx.isValidProperty, ctx.properties, ctx.properties.includes('selectors'))

        const parserResultByFilepath = analyzeTokens(
          ctx,
          (file) => {
            logger.info('cli', `Analyzed ${colors.bold(file)}`)
          },
          mode,
        )

        // const properties = new Map<string, boolean>(ctx.properties.map((prop) => [prop, true]))
        console.time('classify')

        const getRange = (node: Node) => {
          const src = node.getSourceFile()
          const [startPosition, endPosition] = [node.getStart(), node.getEnd()]

          const startInfo = src.getLineAndColumnAtPos(startPosition)
          const endInfo = src.getLineAndColumnAtPos(endPosition)

          return {
            startPosition,
            startLineNumber: startInfo.line,
            startColumn: startInfo.column,
            endPosition,
            endLineNumber: endInfo.line,
            endColumn: endInfo.column,
          }
        }

        const conditions = new Map(Object.entries(ctx.conditions.values))

        const reportByInstanceInFilepath = new Map<string, Set<ReportInstanceItem>>()
        const reportByInstanceOfKind = new Map<'function' | 'component', Set<ReportInstanceItem>>()

        const reportByFilepath = new Map<string, Set<ReportItem>>()
        const reportList = new Set<ReportItem>()

        const reportByPropertyName = new Map<string, Set<ReportItem>>()
        const reportByConditionName = new Map<string, Set<ReportItem>>()
        const reportByShorthand = new Map<string, Set<ReportItem>>()
        const reportByTokenName = new Map<string, Set<ReportItem>>()
        const reportByPropertyPath = new Map<string, Set<ReportItem>>()
        const reportFromKind = new Map<'function' | 'component', Set<ReportItem>>()
        const reportByType = new Map<string, Set<ReportItem>>()
        const reportByInstanceName = new Map<string, Set<ReportItem>>()

        type ReportItemType = 'object' | 'cva' | 'pattern' | 'recipe' | 'jsx' | 'jsx-factory'
        type ReportItem = {
          id: number
          from: string
          type: ReportItemType
          filepath: string
          kind: 'function' | 'component'
          path: string[]
          value: string | number | true
          box: BoxNodeLiteral | BoxNodeEmptyInitializer
        }
        type ReportInstanceItem = Pick<ReportItem, 'from' | 'type' | 'filepath'> & {
          instanceId: number
          value: Record<string, any>
          box: BoxNodeMap
        }

        let id = 0,
          instanceId = 0
        parserResultByFilepath.forEach((parserResult, filepath) => {
          if (parserResult.isEmpty()) return

          // console.log({ filepath, parserResult })
          const localReportByInstanceInFilepath = new Map<string, Set<ReportInstanceItem>>()
          const localReportByInstanceOfKind = new Map<ReportItem['kind'], Set<ReportInstanceItem>>()

          const localReportByPropertyName = new Map<string, Set<ReportItem>>()
          const localReportByConditionName = new Map<string, Set<ReportItem>>()
          const localReportByShorthand = new Map<string, Set<ReportItem>>()
          const localReportByTokenName = new Map<string, Set<ReportItem>>()
          const localReportByPropertyPath = new Map<string, Set<ReportItem>>()
          const localReportFromKind = new Map<ReportItem['kind'], Set<ReportItem>>()
          const localReportByType = new Map<string, Set<ReportItem>>()
          const localReportByInstanceName = new Map<string, Set<ReportItem>>()

          const addTo = (map: Map<string, Set<ReportItem | ReportInstanceItem>>, key: string, value: any) => {
            const set = map.get(key) ?? new Set()
            set.add(value)
            map.set(key, set)
          }

          const processMap = (
            map: BoxNodeMap,
            current: string[],
            { from, type, kind }: { from: ReportItem['from']; type: ReportItem['type']; kind: ReportItem['kind'] },
          ) => {
            map.value.forEach((attrNode, attrName) => {
              if (attrNode.isLiteral() || attrNode.isEmptyInitializer()) {
                const value = attrNode.isLiteral() ? (attrNode.value as string) : true
                const reportItem = {
                  id: id++,
                  from,
                  type,
                  kind,
                  filepath,
                  path: current,
                  value,
                  box: attrNode,
                } as ReportItem // TODO satisfies

                if (conditions.has(attrName)) {
                  addTo(reportByConditionName, attrName, reportItem)
                  addTo(localReportByConditionName, attrName, reportItem)
                } else {
                  const propName = ctx.utility.shorthands.get(attrName) ?? attrName

                  addTo(reportByPropertyName, propName, reportItem)
                  addTo(localReportByPropertyName, propName, reportItem)

                  if (ctx.utility.shorthands.has(attrName)) {
                    addTo(reportByShorthand, attrName, reportItem)
                    addTo(localReportByShorthand, attrName, reportItem)
                  }
                }

                if (current.length) {
                  addTo(reportByPropertyPath, current.concat(attrName).join('.'), reportItem)
                  addTo(localReportByPropertyPath, current.concat(attrName).join('.'), reportItem)
                }

                //
                addTo(reportByTokenName, String(value), reportItem)
                addTo(localReportByTokenName, String(value), reportItem)

                //
                addTo(reportByType, type, reportItem)
                addTo(localReportByType, type, reportItem)

                //
                addTo(reportByInstanceName, from, reportItem)
                addTo(localReportByInstanceName, from, reportItem)

                //
                addTo(reportFromKind, kind, reportItem)
                addTo(localReportFromKind, kind, reportItem)

                //
                addTo(reportByFilepath, filepath, reportItem)
                reportList.add(reportItem)

                return
              }

              if (attrNode.isMap() && attrNode.value.size) {
                return processMap(attrNode, current.concat(attrName), { from, type, kind })
              }
            })
          }

          const processResultItem = (item: ResultItem, kind: ReportItem['kind']) => {
            if (!item.box || item.box.isUnresolvable()) {
              // console.log('no box', item)
              return
            }

            if (!item.data) {
              // console.log('no data', item)
              return
            }

            const from = item.name!
            const type = item.type as ReportItem['type']
            const reportInstanceItem = {
              instanceId: instanceId++,
              from,
              type,
              kind,
              filepath,
              value: item.data,
              box: item.box,
            } as ReportInstanceItem // TODO satisfies

            if (item.box.isList()) {
              addTo(reportByInstanceInFilepath, filepath, reportInstanceItem)
              addTo(localReportByInstanceInFilepath, filepath, reportInstanceItem)

              // console.log(item)
              return reportInstanceItem
            }

            if (item.box.isMap() && item.box.value.size) {
              addTo(reportByInstanceInFilepath, filepath, reportInstanceItem)
              addTo(localReportByInstanceInFilepath, filepath, reportInstanceItem)

              processMap(item.box, [], { from, type, kind })
              return reportInstanceItem
            }
          }

          const processComponentResultItem = (item: ResultItem) => {
            const reportInstanceItem = processResultItem(item, 'component')
            if (!reportInstanceItem) return

            addTo(reportByInstanceOfKind, 'component', reportInstanceItem)
            addTo(localReportByInstanceOfKind, 'component', reportInstanceItem)
          }

          const processFunctionResultItem = (item: ResultItem) => {
            const reportInstanceItem = processResultItem(item, 'function')
            if (!reportInstanceItem) return

            addTo(reportByInstanceOfKind, 'function', reportInstanceItem)
            addTo(localReportByInstanceOfKind, 'function', reportInstanceItem)
          }

          parserResult.jsx.forEach(processComponentResultItem)

          parserResult.css.forEach(processFunctionResultItem)
          parserResult.cva.forEach(processFunctionResultItem)

          parserResult.pattern.forEach((itemList) => {
            itemList.forEach(processFunctionResultItem)
          })
          parserResult.recipe.forEach((itemList) => {
            itemList.forEach(processFunctionResultItem)
          })
        })

        const filesWithMostInstance = Array.from(reportByInstanceInFilepath.entries())
          .map(([filepath, list]) => [filepath, list.size] as const)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)

        const filesWithMostPropValueCombinations = Array.from(reportByFilepath.entries())
          .map(([token, list]) => [token, list.size] as const)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)

        const mostUsedPropNames = Array.from(reportByPropertyName.entries())
          .map(([propName, list]) => [propName, list.size] as const)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
        const mostUsedTokens = Array.from(reportByTokenName.entries())
          .map(([token, list]) => [token, list.size] as const)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)

        const mostUsedShorthands = Array.from(reportByShorthand.entries())
          .map(([shorthand, list]) => [shorthand, list.size] as const)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)

        const mostUsedPropertyPaths = Array.from(reportByPropertyPath.entries())
          .map(([propertyPath, list]) => [propertyPath, list.size] as const)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)

        const mostUsedTypes = Array.from(reportByType.entries())
          .map(([type, list]) => [type, list.size] as const)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)

        const mostUsedInstanceNames = Array.from(reportByInstanceName.entries())
          .map(([componentName, list]) => [componentName, list.size] as const)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)

        const mostUsedFromKinds = Array.from(reportFromKind.entries())
          .map(([kind, list]) => [kind, list.size] as const)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)

        const mostUsedInstanceOfKinds = Array.from(reportByInstanceOfKind.entries())
          .map(([kind, list]) => [kind, list.size] as const)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)

        console.timeEnd('classify')

        console.log({
          counts: {
            filesWithTokens: reportByFilepath.size,
            propNameUsed: reportByPropertyName.size,
            tokenUsed: reportByTokenName.size,
            shorthandUsed: reportByShorthand.size,
            propertyPathUsed: reportByPropertyPath.size,
            typeUsed: reportByType.size,
            instanceNameUsed: reportByInstanceName.size,
            kindUsed: reportFromKind.size,
            instanceOfKindUsed: reportByInstanceOfKind.size,
          },
          //
          filesWithMostInstance,
          filesWithMostPropValueCombinations,
          //
          mostUsedPropNames,
          mostUsedTokens,
          mostUsedShorthands,
          mostUsedPropertyPaths,
          mostUsedTypes,
          mostUsedInstanceNames,
          mostUsedFromKinds,
          mostUsedInstanceOfKinds,
        })

        if (flags?.json && typeof flags.json === 'string') {
          await writeFile(
            flags.json,
            JSON.stringify(
              reportByInstanceInFilepath,
              (key, value) => {
                if (value instanceof Set) {
                  return Array.from(value)
                }

                if (value instanceof Map) {
                  return Object.fromEntries(value)
                }

                if (Node.isNode(value)) {
                  // if (Number.isInteger(Number(key))) return value.getKindName()
                  if (key !== 'node') return value.getKindName()
                  return { kind: value.getKindName(), range: getRange(value) }
                }

                return value
              },
              4,
            ),
          )

          console.log(`JSON report saved to ${flags.json}`)
          return
        }

        if (flags?.html && typeof flags.html === 'string') {
          // TODO codegen analyzer app
          return
        }

        console.log(`Found ${reportList.size} token used in ${reportByInstanceInFilepath.size} files`)

        // TODO output CLI text/json/html
      },
    )

  cli.help()

  cli.version(pkgJson.version)

  cli.parse(process.argv, { run: false })
  await cli.runMatchedCommand()

  updateNotifier({ pkg: packageJson, distTag: 'dev' }).notify()
}

type ParserMode = Parameters<typeof analyzeTokens>[2]
