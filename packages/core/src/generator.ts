import { AtomicStylesheet, GeneratorContext } from '@css-panda/atomic'
import { CSSUtility, mergeUtilityConfigs } from '@css-panda/css-utility'
import { Dictionary } from '@css-panda/dictionary'
import { Config as Conf } from '@css-panda/read-config'
import { promises as fs } from 'fs'
import postcss from 'postcss'

import path from 'path'
import { compileConfig, compileCssFunction, generateTransform } from './compile'
import { generateCss } from './generate-css'
import { generateDts } from './generate-dts'
import { generateJs } from './generate-js'
import { generatePackage } from './generate-package'

export async function generator() {
  const fixtureDir = path.dirname(require.resolve('@css-panda/fixture'))
  const rootDir = path.join(fixtureDir, 'src', 'config.ts')
  const conf = await new Conf().load(path.join(fixtureDir, 'src', 'config'))
  console.log('------loaded---------')

  const config = conf.config as any

  /* -----------------------------------------------------------------------------
   * Setup resources
   * -----------------------------------------------------------------------------*/

  const dict = new Dictionary({
    tokens: config.tokens,
    semanticTokens: config.semanticTokens,
    prefix: config.prefix,
  })

  const utilites = new CSSUtility({
    tokens: dict,
    config: mergeUtilityConfigs(config.utilities),
  })

  const context: GeneratorContext = {
    root: postcss.root(),
    conditions: config.conditions ?? {},
    transform(prop, value) {
      return utilites.resolve(prop, value)
    },
  }

  /* -----------------------------------------------------------------------------
   * [codegen] Generate design system artifacts
   * -----------------------------------------------------------------------------*/

  await fs.writeFile('__generated__/config.js', compileConfig(rootDir))
  fs.mkdir('__generated__/css', { recursive: true })
  await fs.writeFile('__generated__/css/transform.js', generateTransform('../config'))
  await fs.writeFile('__generated__/css/index.js', compileCssFunction('./transform'))

  await Promise.all([
    fs.mkdir('__generated__/design-tokens'),
    fs.writeFile('__generated__/design-tokens/tokens.css', generateCss(dict, { conditions: context.conditions })),
    fs.writeFile('__generated__/design-tokens/tokens.d.ts', generateDts(dict)),
    fs.writeFile('__generated__/design-tokens/tokens.js', generateJs(dict)),
    fs.writeFile(
      '__generated__/package.json',
      generatePackage({
        name: 'dot-panda',
        exports: ['design-tokens', 'css'],
      }),
    ),
  ])

  /* -----------------------------------------------------------------------------
   * [codegen] Parse files and extract css
   * -----------------------------------------------------------------------------*/

  const stylesheet = new AtomicStylesheet(context)

  stylesheet.process(
    {
      background: 'red.200',
      margin: '40px',
      color: 'red',

      selectors: {
        '&:hover': {
          background: { dark: 'current', light: '#fff' },
          margin: '4',
        },
      },
      '@media': {
        'screen and (min-width: 768px)': {
          color: 'gray.200',
          marginLeft: '40px',
        },
      },
    },
    // { hash: true },
  )

  await fs.writeFile('__generated__/styles.css', stylesheet.toCss())
}

generator()
