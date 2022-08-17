import { AtomicStylesheet, expandScreenAtRule, GeneratorContext } from '@css-panda/atomic'
import { CSSUtility, mergeUtilityConfigs } from '@css-panda/css-utility'
import { Dictionary } from '@css-panda/dictionary'
import { Config as Conf } from '@css-panda/read-config'
import fs from 'fs-extra'
import postcss from 'postcss'
import path from 'path'
import { compileConfig, compileCssFunction, generateTransform } from './compile'
import { generateCss } from './generate-css'
import { generateDts } from './generate-dts'
import { generateJs } from './generate-js'
import { generatePackage } from './generate-package'
import { transformSync, createCollector, createPlugins } from '@css-panda/parser'
import { info, log } from '@css-panda/logger'
import { createContext } from './create-context'

export async function generator() {
  const fixtureDir = path.dirname(require.resolve('@css-panda/fixture'))
  const rootDir = path.join(fixtureDir, 'src', 'config.ts')

  const { config } = await new Conf().load(path.join(fixtureDir, 'src', 'config'))
  const { stylesheet, context } = createContext(config)

  /* -----------------------------------------------------------------------------
   * [codegen] Generate design system artifacts
   * -----------------------------------------------------------------------------*/

  // await fs.writeFile('__generated__/config.js', compileConfig(rootDir))
  // fs.mkdir('__generated__/css', { recursive: true })
  // await fs.writeFile('__generated__/css/transform.js', generateTransform('../config'))
  // await fs.writeFile('__generated__/css/index.js', compileCssFunction('./transform'))

  // await Promise.all([
  //   fs.mkdir('__generated__/design-tokens'),
  //   fs.writeFile('__generated__/design-tokens/tokens.css', generateCss(dict, { conditions: context.conditions })),
  //   fs.writeFile('__generated__/design-tokens/tokens.d.ts', generateDts(dict)),
  //   fs.writeFile('__generated__/design-tokens/tokens.js', generateJs(dict)),
  //   fs.writeFile(
  //     '__generated__/package.json',
  //     generatePackage({
  //       name: 'dot-panda',
  //       exports: ['design-tokens', 'css'],
  //     }),
  //   ),
  // ])

  /* -----------------------------------------------------------------------------
   * [codegen] Parse files and extract css
   * -----------------------------------------------------------------------------*/

  const __file = await fs.readFile('test.js', { encoding: 'utf-8' })

  const collected = createCollector()

  transformSync(__file, {
    file: 'js',
    plugins: createPlugins(collected, './__generated__/css'),
  })

  collected.css.forEach(({ data: style }) => {
    console.log(style)
    stylesheet.process(style)
  })

  await fs.writeFile('__generated__/styles.css', stylesheet.toCss())
}

generator()
