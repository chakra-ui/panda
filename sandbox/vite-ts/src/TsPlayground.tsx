import { createParser, createProject } from '@pandacss/parser'
import { Conditions, Stylesheet, Utility, createRoot } from '@pandacss/core'
import { config } from '@pandacss/presets'
import { TokenDictionary } from '@pandacss/token-dictionary'
import { useMemo, useState } from 'react'
import { css } from '../design-system/css'
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live'
import dracula from 'prism-react-renderer/themes/dracula'

const outdir = '.'
const importMap = {
  css: `${outdir}/css`,
  recipe: `${outdir}/recipes`,
  pattern: `${outdir}/patterns`,
  jsx: `${outdir}/jsx`,
}

const parseSourceFile = createParser({
  importMap,
  jsx: {
    factory: 'panda',
    isStyleProp: () => true,
    nodes: [],
  },
})

export const TsPlayground = () => {
  const [source, setSource] = useState(
    //language=tsx
    `
import { css } from './css'

function SomeComponent() {
  return (
      <div
          className={css({
            textTransform: 'uppercase',
          })}
      >
        Hello
      </div>
  )
}     
    `,
  )

  const result = useMemo(() => {
    const project = createProject({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile('test.tsx', source)
    const parseResult = parseSourceFile(sourceFile)

    const breakpoints = {
      sm: '640px',
      md: '768px',
    }
    const tokensProp = config.tokens
    const semanticTokens = {}
    const prefix = ''
    const separator = ''
    const utilities = config.utilities
    const conditionsProp = config.conditions
    const hash = false
    const helpers = {}

    const tokens = new TokenDictionary({
      tokens: tokensProp,
      breakpoints,
      semanticTokens,
      prefix,
    })
    const utility = new Utility({
      prefix: '',
      tokens: tokens,
      config: utilities,
      separator,
    })

    const conditions = new Conditions({
      conditions: conditionsProp,
      breakpoints,
    })

    const sheet = new Stylesheet({
      root: createRoot(),
      conditions,
      hash,
      helpers,
      utility,
    })

    console.log(parseResult)
    parseResult.css.forEach((css) => {
      sheet.processAtomic(css.data)
    })

    console.log(sheet.toCss())
    return sheet.toCss()
  }, [source])

  return (
    <>
      <style style={{ display: 'block', whiteSpace: 'pre' }}>{result}</style>
      <LiveProvider transformCode={(origCode) => origCode.replaceAll(/import.*/g, '')} code={source} scope={{ css }}>
        <LiveEditor
          code={source}
          onChange={setSource}
          theme={dracula}
          className={css({ background: 'black', '& *': { fontFamily: 'mono' } })}
        />
        <LiveError />
        <LivePreview className={css({ p: '4', border: '1px solid' })} />
      </LiveProvider>
    </>
  )
}
