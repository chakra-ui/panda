import { createConditions, GeneratorContext, Stylesheet } from '@css-panda/atomic'
import { mergeRecipes } from '@css-panda/css-recipe'
import { CSSUtility, mergeUtilities } from '@css-panda/css-utility'
import { Dictionary } from '@css-panda/dictionary'
import type { LoadConfigResult } from '@css-panda/read-config'
import type { Pattern, UserConfig } from '@css-panda/types'
import path from 'path'
import postcss from 'postcss'
import fs from 'fs-extra'
import { createDebug } from './debug'

const BASE_IGNORE = ['node_modules', '.git', '__tests__', 'tests']

function mergePatterns(values: Pattern[]) {
  return values.reduce<Record<string, Pattern>>((acc, value) => {
    Object.assign(acc, { [value.name]: value })
    return acc
  }, {})
}

export function createContext(conf: LoadConfigResult<UserConfig>) {
  const { config } = conf

  const {
    cwd: _cwd,
    breakpoints = {},
    conditions = {},
    tokens = {},
    semanticTokens = {},
    prefix,
    outdir,
    exclude,
    patterns = [],
    recipes = [],
    utilities: _utilities = [],
  } = config

  const cwd = path.resolve(_cwd) || process.cwd()

  const configPath = path.join(cwd, outdir, 'config.js')
  const cssPath = path.join(cwd, outdir, 'css')
  const dsPath = path.join(cwd, outdir, 'design-tokens')
  const typesPath = path.join(cwd, outdir, 'types')
  const recipePath = path.join(cwd, outdir, 'recipes')
  const patternPath = path.join(cwd, outdir, 'patterns')
  const tempPath = path.join(cwd, outdir, '.temp')

  const dictionary = new Dictionary({ tokens, semanticTokens, prefix })

  const utilities = new CSSUtility({
    tokens: dictionary,
    config: mergeUtilities(_utilities),
  })

  const context = (): GeneratorContext => ({
    root: postcss.root(),
    breakpoints,
    conditions: createConditions({
      conditions,
      breakpoints,
    }),
    transform(prop, value) {
      return utilities.resolve(prop, value)
    },
  })

  const stylesheet = new Stylesheet(context())

  const temp = {
    dir: tempPath,
    getPath(file: string) {
      return path.join(temp.dir, temp.format(file))
    },
    readFile(file: string) {
      return fs.readFile(path.join(temp.dir, file), 'utf8')
    },
    getFiles() {
      return fs.readdirSync(temp.dir)
    },
    format(file: string) {
      return file.replaceAll(path.sep, '__').replace(path.extname(file), '.css')
    },
    write(file: string, css: string) {
      const filepath = temp.getPath(file)
      fs.writeFileSync(filepath, css)
      return filepath
    },
    rm(file: string) {
      fs.unlinkSync(temp.getPath(file))
    },
    get glob() {
      return [`${temp.dir}/*.css`]
    },
  }

  createDebug('config:tmpfile', temp.dir)

  const outputCss = {
    path: path.join(cwd, outdir, 'styles.css'),
    write(css: string) {
      return fs.writeFileSync(outputCss.path, css)
    },
  }

  return {
    ...config,
    cwd,
    exclude: BASE_IGNORE.concat(outdir, exclude ?? []),

    importMap: {
      css: `${outdir}/css`,
      recipe: `${outdir}/recipes`,
      pattern: `${outdir}/patterns`,
    },

    recipes: mergeRecipes(recipes, utilities),
    patterns: mergePatterns(patterns),

    outputCss,
    temp,

    paths: {
      temp: tempPath,
      css: cssPath,
      ds: dsPath,
      types: typesPath,
      recipe: recipePath,
      pattern: patternPath,
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

export type InternalContext = ReturnType<typeof createContext>
