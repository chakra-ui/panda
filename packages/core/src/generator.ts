import { AtomicStylesheet, GeneratorContext } from '@css-panda/atomic'
import { CSSUtility, mergeUtilityConfigs } from '@css-panda/css-utility'
import { Dictionary } from '@css-panda/dictionary'
import { Config } from '@css-panda/types'
import postcss from 'postcss'
import { config as defaultConfig } from '@css-panda/fixture'
import { promises as fs } from 'fs'

import { generateCss } from './generate-css'
import { generateDts } from './generate-dts'
import { generateJs, bundleCss } from './generate-js'

export async function generator(config: Config) {
  const { tokens = {}, semanticTokens = {} } = config

  const dict = new Dictionary({
    tokens,
    //@ts-ignore
    semanticTokens,
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

  await Promise.all([
    fs.writeFile('__generated__/styles.css', stylesheet.toCss()),
    fs.writeFile('__generated__/tokens.css', generateCss(dict, { conditions: context.conditions })),
    fs.writeFile('__generated__/tokens.d.ts', generateDts(dict)),
    fs.writeFile('__generated__/tokens.js', generateJs(dict)),
    fs.writeFile('__generated__/css.js', bundleCss()),
  ])
}

generator(defaultConfig)
