import { Generator } from '@pandacss/generator'
import { Project } from '@pandacss/parser'
import { UserConfig } from '@pandacss/types'

function getConfig(config?: UserConfig) {
  return {
    cwd: '',
    include: [],
    outdir: 'styled-system',
    preflight: true,
    ...config,
  }!
}

interface CssArtifact {
  file: string
  code: string | undefined
  dir?: string[] | undefined
}

export function extract(code: string, config?: UserConfig) {
  const context = new Generator({
    dependencies: [],
    serialized: '',
    deserialize: () => getConfig(config),
    path: '',
    hooks: {},
    config: getConfig(config),
  })

  const sheet = context.createSheet()
  context.appendLayerParams(sheet)
  context.appendBaselineCss(sheet)

  const staticSheet = context.createSheet()
  context.appendCssOfType('static', staticSheet)

  const staticCssArtifacts = [
    { file: 'Tokens', code: sheet.getLayerCss('tokens') },
    { file: 'Reset', code: sheet.getLayerCss('reset') },
    { file: 'Global', code: sheet.getLayerCss('base') },
    { file: 'Static', code: staticSheet.getLayerCss('recipes', 'utilities') },
  ]

  const project = new Project({
    useInMemoryFileSystem: true,
    parserOptions: context.parserOptions,
    getFiles: () => ['code.tsx'],
    readFile: (file) => (file === 'code.tsx' ? code : ''),
    hooks: context.hooks,
  })

  const encoder = context.encoder.clone()
  const parserResult = project.parseSourceFile('code.tsx', encoder)
  const decoder = context.decoder.clone().collect(encoder)

  sheet.processDecoder(decoder)

  const cssArtifacts: CssArtifact[] = [
    { file: 'Utilities', code: sheet.getLayerCss('utilities') },
    { file: 'Recipes', code: sheet.getLayerCss('recipes') },
    ...staticCssArtifacts,
  ]

  const css = cssArtifacts.map((a) => a.code ?? '').join('\n')

  console.log(parserResult)

  const jsArtifacts = context.getArtifacts() ?? []

  const allJsFiles = jsArtifacts.flatMap((a) => a?.files.filter((f) => f.file.endsWith('.mjs')) ?? [])
  const js = allJsFiles
    .map((f) => f.code?.replaceAll(/import .*/g, '').replaceAll(/export \* from '(.+?)';/g, ''))
    ?.join('\n')

  return { css, js }
}
