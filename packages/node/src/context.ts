import type { LoadConfigResult } from '@pandacss/config'
import {
  assignCompositions,
  Conditions,
  getStaticCss as getStaticCssCore,
  mergeCss,
  Stylesheet,
  StylesheetContext,
  Utility,
} from '@pandacss/core'
import { isCssProperty } from '@pandacss/is-valid-prop'
import { logger } from '@pandacss/logger'
import { Collector, createParser, createProject } from '@pandacss/parser'
import { capitalize, compact, dashCase, mapObject, splitProps, uncapitalize } from '@pandacss/shared'
import { TokenDictionary } from '@pandacss/token-dictionary'
import type { Dict, PatternConfig, RecipeConfig } from '@pandacss/types'
import glob from 'fast-glob'
import { readdirSync, readFileSync } from 'fs'
import { emptyDir, ensureDir, existsSync } from 'fs-extra'
import { readFile, unlink, writeFile } from 'fs/promises'
import { extname, isAbsolute, join, relative, resolve, sep } from 'path'
import postcss from 'postcss'
import { Project, ScriptKind } from 'ts-morph'
import { match, P } from 'ts-pattern'

/* -----------------------------------------------------------------------------
 * Input - Output
 * -----------------------------------------------------------------------------*/

type IO = {
  read(id: string): Promise<string>
  write(id: string, content: string): Promise<void>
  rm(id: string): Promise<void>
}

export type Output = {
  dir?: string
  files: Array<{
    file: string
    code: string | undefined
  }>
}

const helpers = {
  map: mapObject,
}

const fileSystem: IO = {
  read: (path: string) => {
    return readFile(path, 'utf-8')
  },
  write: (path: string, code: string) => {
    return writeFile(path, code)
  },
  rm: (path: string) => {
    return unlink(path)
  },
}

/* -----------------------------------------------------------------------------
 * CLI Context
 * -----------------------------------------------------------------------------*/

export function createContext(conf: LoadConfigResult, io = fileSystem) {
  const { config } = conf

  const {
    cwd: cwdProp = process.cwd(),
    conditions: conditionsProp = {},
    cssVarPrefix,
    cssVarRoot = ':where(:root, :host)',
    outdir,
    exclude: excludeProp = [],
    patterns = {},
    theme = {},
    utilities = {},
    hash,
    jsxFactory = 'panda',
    jsxFramework,
    globalCss,
    separator,
    static: staticCss,
  } = config

  const {
    breakpoints = {},
    tokens: tokensProp = {},
    semanticTokens = {},
    recipes = {},
    textStyles,
    layerStyles,
  } = theme

  /* -----------------------------------------------------------------------------
   * Jsx factory details
   * -----------------------------------------------------------------------------*/

  const jsxFactoryDetails = {
    name: jsxFactory,
    upperName: capitalize(jsxFactory),
    typeName: `HTML${capitalize(jsxFactory)}Props`,
    componentName: `${capitalize(jsxFactory)}Component`,
    framework: jsxFramework,
  }

  const cwd = resolve(cwdProp)
  const exclude = ['.git', 'node_modules', 'test-results'].concat(excludeProp)

  /* -----------------------------------------------------------------------------
   * Core utilities
   * -----------------------------------------------------------------------------*/

  const tokens = new TokenDictionary({
    tokens: tokensProp,
    semanticTokens,
    prefix: cssVarPrefix,
  })

  const hasTokens = !tokens.isEmpty

  logger.debug({ type: 'ctx:token', msg: tokens.allNames })

  const utility = new Utility({
    tokens: tokens,
    config: utilities,
    separator,
  })

  const conditions = new Conditions({
    conditions: conditionsProp,
    breakpoints,
  })

  logger.debug({ type: 'ctx:conditions', msg: conditions })

  assignCompositions(
    { conditions, utility },
    compact({
      textStyle: textStyles,
      layerStyle: layerStyles,
    }),
  )

  const context = (): StylesheetContext => ({
    root: postcss.root(),
    conditions,
    hash,
    helpers,
    utility,
  })

  /* -----------------------------------------------------------------------------
   * Patterns
   * -----------------------------------------------------------------------------*/

  function getPattern(name: string): PatternConfig | undefined {
    return patterns[name]
  }

  function execPattern(name: string, data: Record<string, any>) {
    const pattern = getPattern(name)
    return pattern?.transform?.(data, helpers) ?? {}
  }

  function getPatternDetails(name: string, pattern: PatternConfig | undefined) {
    const upperName = capitalize(name)
    return {
      name,
      props: Object.keys(pattern?.properties ?? {}),
      dashName: dashCase(name),
      upperName: upperName,
      styleFn: `get${upperName}Style`,
      jsxName: pattern?.jsx ?? upperName,
      blocklistType: pattern?.blocklist ? `| '${pattern.blocklist.join("' | '")}'` : '',
    }
  }

  const patternNodes = Object.entries(patterns).map(([name, pattern]) => ({
    type: 'pattern' as const,
    name: pattern.jsx ?? capitalize(name),
    props: Object.keys(pattern.properties),
    baseName: name,
  }))

  function getPatternFnName(jsx: string) {
    return patternNodes.find((node) => node.name === jsx)?.baseName ?? uncapitalize(jsx)
  }

  const hasPatterns = Object.keys(patterns).length > 0

  /* -----------------------------------------------------------------------------
   * Recipes
   * -----------------------------------------------------------------------------*/

  function getRecipe(name: string): RecipeConfig | undefined {
    return recipes[name]
  }

  const recipeNodes = Object.entries(recipes).map(([name, recipe]) => ({
    type: 'recipe' as const,
    name: recipe.jsx ?? capitalize(name),
    props: Object.keys(recipe.variants ?? {}),
    baseName: name,
  }))

  function getRecipeFnName(jsx: string) {
    return recipeNodes.find((node) => node.name === jsx)?.baseName ?? uncapitalize(jsx)
  }

  function splitRecipeProps(name: string, props: Dict) {
    const recipe = recipeNodes.find((node) => node.name === name)
    if (!recipe) return [{}, props]
    return splitProps(props, recipe.props)
  }

  function getRecipeDetails() {
    return Object.entries(recipes).map(([name, recipe]) => ({
      [name]: Object.entries(recipe.variants ?? {}).map(([key, value]) => ({
        [key]: Object.keys(value),
      })),
    }))
  }

  const hasRecipes = Object.keys(recipes).length > 0

  /* -----------------------------------------------------------------------------
   * User defined utilities or properties
   * -----------------------------------------------------------------------------*/

  const properties = Array.from(new Set(['css', ...utility.keys(), ...conditions.keys()]))

  function isCustomCssProperty(prop: string) {
    const regex = new RegExp('^(?:' + properties.join('|') + ')$')
    return regex.test(prop)
  }

  function isStyleProp(prop: string) {
    return isCssProperty(prop) || isCustomCssProperty(prop)
  }

  /* -----------------------------------------------------------------------------
   * Paths
   * -----------------------------------------------------------------------------*/

  function getPath(...str: string[]) {
    return join(cwd, outdir, ...str)
  }

  function absPath(str: string) {
    return isAbsolute(str) ? str : join(cwd, str)
  }

  const paths = {
    config: getPath('config.js'),
    css: getPath('css'),
    token: getPath('tokens'),
    types: getPath('types'),
    recipe: getPath('recipes'),
    pattern: getPath('patterns'),
    chunk: getPath('chunks'),
    outCss: getPath('styles.css'),
    jsx: getPath('jsx'),
  }

  async function write(dir: string, options: Array<{ file: string; code: string | undefined }>) {
    await ensureDir(dir)
    return Promise.all(
      options.map(async ({ file, code }) => {
        const absPath = join(dir, file)
        if (code) {
          return io.write(absPath, code)
        }
      }),
    )
  }

  function cleanOutdir() {
    return emptyDir(outdir)
  }

  function writeOutput(output: Output) {
    const { dir = outdir, files } = output
    return write(dir, files)
  }

  /* -----------------------------------------------------------------------------
   *  Asssets (generated css per file)
   * -----------------------------------------------------------------------------*/

  const chunks = {
    dir: paths.chunk,
    readFile(file: string) {
      let fileName = chunks.format(file)
      fileName = join(paths.chunk, fileName)
      if (!existsSync(fileName)) {
        return Promise.resolve('')
      }
      return io.read(fileName)
    },
    getFiles() {
      if (!existsSync(chunks.dir)) return []
      return readdirSync(chunks.dir)
    },
    format(file: string) {
      return relative(cwd, file).replaceAll(sep, '__').replace(extname(file), '.css')
    },
    async write(file: string, css: string) {
      const fileName = chunks.format(file)

      const oldCss = await chunks.readFile(file)
      const newCss = mergeCss(oldCss, css)

      logger.debug({ type: 'chunk:write', file, path: fileName })

      return write(paths.chunk, [{ file: fileName, code: newCss }])
    },
    rm(file: string) {
      const fileName = chunks.format(file)
      return io.rm(join(paths.chunk, fileName))
    },
    glob: [`${paths.chunk}/**/*.css`],
  }

  /* -----------------------------------------------------------------------------
   * Setup the typescript tsx program and source files
   * -----------------------------------------------------------------------------*/

  function getFiles() {
    if (!config.include) return []
    return glob.sync(config.include, { cwd, ignore: config.exclude, absolute: true })
  }

  const files = getFiles()

  logger.debug({ type: 'ctx:files', msg: files })

  const tsProject: Project = createProject()

  function addSourceFile(file: string) {
    tsProject.createSourceFile(file, readFileSync(file, 'utf8'), {
      overwrite: true,
      scriptKind: ScriptKind.TSX,
    })
  }

  function reloadSourceFile(file: string) {
    const sourceFile = tsProject.getSourceFile(file)
    sourceFile?.refreshFromFileSystemSync()
  }

  function reloadSourceFiles() {
    const files = getFiles()
    for (const file of files) {
      const source = tsProject.getSourceFile(file)
      if (source) {
        source.refreshFromFileSystemSync()
      } else {
        tsProject.addSourceFileAtPath(file)
      }
    }
  }

  function getSourceFile(file: string) {
    return tsProject.getSourceFile(absPath(file))
  }

  function removeSourceFile(file: string) {
    const sourceFile = tsProject.getSourceFile(absPath(file))
    if (sourceFile) {
      return tsProject.removeSourceFile(sourceFile)
    }
  }

  files.forEach((file) => {
    addSourceFile(file)
  })

  /* -----------------------------------------------------------------------------
   * Collect extracted styles
   * -----------------------------------------------------------------------------*/

  const importMap = {
    css: `${outdir}/css`,
    recipe: `${outdir}/recipes`,
    pattern: `${outdir}/patterns`,
    jsx: `${outdir}/jsx`,
  }

  const parseSourceFile = createParser({
    importMap,
    jsx: {
      factory: jsxFactory,
      isStyleProp,
      nodes: [...patternNodes, ...recipeNodes],
    },
  })

  function getGlobalCss() {
    const sheet = new Stylesheet(context())

    sheet.processGlobalCss({
      ':root': {
        '--made-with-panda': `'🐼'`,
      },
    })

    if (globalCss) {
      sheet.processGlobalCss(globalCss)
    }

    return sheet.toCss()
  }

  function getStaticCss() {
    if (!staticCss) return

    const sheet = new Stylesheet(context())
    const recipes = getRecipeDetails()

    const getResults = getStaticCssCore(staticCss)
    const results = getResults({
      breakpoints: Object.keys(breakpoints ?? {}),
      getPropertyKeys: utility.getPropertyKeys,
      getRecipeKeys(recipe) {
        return recipes[recipe]
      },
    })

    results.css.forEach((css) => {
      sheet.processAtomic(css)
    })

    results.recipes.forEach((result) => {
      Object.entries(result).forEach(([key, value]) => {
        const recipe = getRecipe(key)
        if (!recipe) return
        sheet.processRecipe(recipe, value)
      })
    })

    return sheet.toCss()
  }

  function getCss(collector: Collector, file: string) {
    const sheet = new Stylesheet(context())

    collector.css.forEach((result) => {
      sheet.processAtomic(result.data)
    })

    collector.cva.forEach((result) => {
      sheet.processAtomicRecipe(result.data)
    })

    collector.jsx.forEach((result) => {
      const { data, type, name } = result
      const { css = {}, ...rest } = data

      const styles = { ...css, ...rest }

      match([name, type])
        // treat pattern jsx like regular pattern
        .with([P.string, 'pattern'], ([name]) => {
          collector.setPattern(getPatternFnName(name), { data: styles })
        })
        // treat recipe jsx like regular recipe + atomic
        .with([P.string, 'recipe'], ([name]) => {
          const [recipeProps, atomicProps] = splitRecipeProps(name, styles)
          collector.setRecipe(getRecipeFnName(name), { data: recipeProps })
          sheet.processAtomic(atomicProps)
        })
        // read and process style props
        .otherwise(() => {
          sheet.processAtomic(styles)
        })
    })

    collector.recipe.forEach((result, name) => {
      try {
        for (const item of result) {
          const recipe = getRecipe(name)
          if (!recipe) continue
          sheet.processRecipe(recipe, item.data)
        }
      } catch (error) {
        logger.error({ err: error })
      }
    })

    collector.pattern.forEach((result, name) => {
      try {
        for (const item of result) {
          const styles = execPattern(name, item.data)
          sheet.processAtomic(styles)
        }
      } catch (error) {
        logger.error({ err: error })
      }
    })

    if (collector.isEmpty) {
      return
    }

    return {
      css: sheet.toCss({ minify: config.minify }),
      file: chunks.format(file),
    }
  }

  function extract(fn: (file: string) => Promise<{ css: string; file: string } | undefined>) {
    return Promise.all(getFiles().map(fn))
  }

  return {
    ...config,
    theme,
    config,
    configPath: conf.path,
    cwd,
    conf,

    chunks,
    files,

    helpers,
    context,
    exclude,
    conditions,

    importMap,
    reloadSourceFiles,
    getSourceFile,
    addSourceFile,
    reloadSourceFile,
    removeSourceFile,
    parseSourceFile,

    getPath,
    paths,
    write,
    writeOutput,
    cleanOutdir,

    cssVarRoot,
    tokens,
    hasTokens,

    utility,
    getCss,
    getGlobalCss,
    getStaticCss,

    patterns,
    hasPatterns,
    getPattern,
    execPattern,
    patternNodes,
    getPatternFnName,
    getPatternDetails,

    recipes,
    getRecipe,
    hasRecipes,
    getRecipeDetails,

    jsxFactory,
    jsxFactoryDetails,

    properties,
    extract,
  }
}

export type PandaContext = ReturnType<typeof createContext>
