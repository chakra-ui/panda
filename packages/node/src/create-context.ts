import type { LoadConfigResult } from '@css-panda/config'
import { Conditions, GeneratorContext, mergeRecipes, mergeUtilities, Stylesheet, Utility } from '@css-panda/core'
import { logger } from '@css-panda/logger'
import { mapObject } from '@css-panda/shared'
import { TokenMap } from '@css-panda/tokens'
import type { Pattern } from '@css-panda/types'
import glob from 'fast-glob'
import fs from 'fs-extra'
import path from 'path'
import postcss from 'postcss'
import { Writer } from 'steno'

const BASE_IGNORE = ['node_modules', '.git']

function mergePatterns(values: Pattern[]) {
  return values.reduce<Record<string, Pattern>>((acc, value) => {
    Object.assign(acc, { [value.name]: value })
    return acc
  }, {})
}

export function createContext(conf: LoadConfigResult) {
  const { config } = conf

  const {
    cwd: _cwd = process.cwd(),
    breakpoints = {},
    conditions = {},
    tokens = {},
    semanticTokens = {},
    cssVar,
    outdir,
    exclude,
    patterns = [],
    recipes = [],
    utilities: _utilities = [],
  } = config

  const cwd = path.resolve(_cwd)

  const configPath = path.join(cwd, outdir, 'config.js')
  const cssPath = path.join(cwd, outdir, 'css')
  const dsPath = path.join(cwd, outdir, 'design-tokens')
  const typesPath = path.join(cwd, outdir, 'types')
  const recipePath = path.join(cwd, outdir, 'recipes')
  const patternPath = path.join(cwd, outdir, 'patterns')
  const assetPath = path.join(cwd, outdir, 'assets')
  const outCssPath = path.join(cwd, outdir, 'styles.css')
  const jsxPath = path.join(cwd, outdir, 'jsx')

  const dictionary = new TokenMap({
    tokens,
    semanticTokens,
    prefix: cssVar?.prefix,
  })

  const utilities = new Utility({
    tokens: dictionary,
    config: mergeUtilities(_utilities),
  })

  const helpers = { map: mapObject }

  const context = (): GeneratorContext => ({
    root: postcss.root(),
    breakpoints,
    conditions: new Conditions({
      conditions,
      breakpoints,
    }),
    helpers,
    utility: utilities,
    transform(prop, value) {
      return utilities.resolve(prop, value)
    },
  })

  const ctx = context()

  const stylesheet = new Stylesheet(ctx)

  const assets = {
    dir: assetPath,
    getPath(file: string) {
      return path.join(assets.dir, assets.format(file))
    },
    readFile(file: string) {
      return fs.readFile(path.join(assets.dir, file), 'utf8')
    },
    getFiles() {
      return fs.readdirSync(assets.dir)
    },
    format(file: string) {
      return file.replaceAll(path.sep, '__').replace(path.extname(file), '.css')
    },
    async write(file: string, css: string) {
      if (!css) return
      const filepath = assets.getPath(file)
      await fs.writeFile(filepath, css)
      logger.debug({ type: 'asset:write', file, path: filepath })
    },
    rm(file: string) {
      fs.unlinkSync(assets.getPath(file))
    },
    glob: [`${assetPath}/**/*.css`],
  }

  const outputWriter = new Writer(outCssPath)

  const outputCss = {
    path: outCssPath,
    write(css: string) {
      return outputWriter.write(css)
    },
  }

  const cssPropKeys = Array.from(
    // prettier-ignore
    new Set([
      'css',
      ...Object.keys(utilities.config),
      ...Object.keys(ctx.conditions.values),
    ]),
  )

  const sourceFiles = glob.sync(config.include, { cwd, ignore: config.exclude })

  return {
    ...config,
    cwd,
    exclude: BASE_IGNORE.concat(outdir, exclude ?? []),

    importMap: {
      css: `${outdir}/css`,
      recipe: `${outdir}/recipes`,
      pattern: `${outdir}/patterns`,
      jsx: `${outdir}/jsx`,
    },

    recipes: mergeRecipes(recipes, ctx),
    patterns: mergePatterns(patterns),

    outputCss,
    assets,

    hasTokens: !dictionary.isEmpty,
    hasRecipes: recipes.length > 0,
    hasPatterns: patterns.length > 0,

    sourceFiles,

    paths: {
      asset: assetPath,
      css: cssPath,
      ds: dsPath,
      types: typesPath,
      recipe: recipePath,
      pattern: patternPath,
      config: configPath,
      jsx: jsxPath,
    },

    helpers,

    cssPropKeys,
    isUtilityProp(prop: string) {
      const regex = new RegExp('^(?:' + Array.from(cssPropKeys).join('|') + ')$')
      return regex.test(prop)
    },

    conf,
    config,
    configPath,
    dictionary,
    context,
    stylesheet,
    utilities,
  }
}

export type Context = ReturnType<typeof createContext>
