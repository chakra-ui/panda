import { createConditions, GeneratorContext, Stylesheet } from '@css-panda/atomic'
import { mergeRecipes } from '@css-panda/css-recipe'
import { CSSUtility, mergeUtilities } from '@css-panda/css-utility'
import { Dictionary } from '@css-panda/dictionary'
import { LoadConfigResult } from '@css-panda/read-config'
import { UserConfig } from '@css-panda/types'
import path from 'path'
import postcss from 'postcss'
import fs from 'fs-extra'
import { createDebug } from './debug'

const BASE_IGNORE = ['node_modules', '.git', '__tests__', 'tests']

function arrayToObject(array: any[]) {
  return array.reduce((acc, item) => {
    Object.assign(acc, { [item.name]: item })
    return acc
  }, {} as Record<string, any>)
}

export function createContext(conf: LoadConfigResult<UserConfig>) {
  const { config } = conf
  const { breakpoints = {}, conditions = {}, tokens = {}, semanticTokens = {}, prefix } = config

  const dictionary = new Dictionary({ tokens, semanticTokens, prefix })

  const utilities = new CSSUtility({
    tokens: dictionary,
    config: mergeUtilities(config.utilities),
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
    dir: path.join(config.outdir, '.temp'),
    getPath(file: string) {
      return path.join(temp.dir, temp.format(file))
    },
    readFile(file: string) {
      return fs.readFile(temp.getPath(file), 'utf8')
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

  const cwd = config.cwd || process.cwd()

  const outputCss = {
    path: path.join(config.outdir, 'styles.css'),
    write(css: string) {
      return fs.writeFileSync(outputCss.path, css)
    },
  }

  return {
    ...config,
    cwd,
    exclude: BASE_IGNORE.concat(config.outdir, config.exclude ?? []),

    importMap: {
      css: `${config.outdir}/css`,
      recipe: `${config.outdir}/recipes`,
      pattern: `${config.outdir}/patterns`,
    },

    recipes: mergeRecipes(config.recipes, utilities),
    patterns: arrayToObject(config.patterns ?? []),

    outputCss,
    temp,

    conf,
    config,
    dictionary,
    context,
    stylesheet,
    utilities,
  }
}

export type InternalContext = ReturnType<typeof createContext>
