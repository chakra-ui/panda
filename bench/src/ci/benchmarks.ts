import { createCompiler } from '@pandacss/compiler'
import { LAYERS } from './constants'
import { timed, median, round, bytes, gzip } from './helpers'
import { extractionConfig, staticCssConfig, type SourceFile } from './corpus'

export function benchExtraction(files: SourceFile[], runs: number) {
  const setup: number[] = []
  const parse: number[] = []
  const emit: number[] = []
  let css = ''

  for (let r = 0; r < runs; r++) {
    const [setupMs, compiler] = timed(() => createCompiler(extractionConfig(), { crossFile: false }))
    const [parseMs] = timed(() => {
      for (const file of files) compiler.parseFileSource(file.path, file.source)
    })
    const [emitMs, out] = timed(() => compiler.getLayerCss({ layers: [...LAYERS] }).css)
    setup.push(setupMs)
    parse.push(parseMs)
    emit.push(emitMs)
    css = out
  }

  return {
    perf: {
      'setup.ms': round(median(setup)),
      'parse.cold.ms': round(median(parse)),
      'emit.ms': round(median(emit)),
    },
    size: {
      'css.bytes': bytes(css),
      'css.gzip.bytes': gzip(css),
    },
  }
}

export function benchStaticCss(runs: number) {
  const config = staticCssConfig()
  const emit: number[] = []
  let css = ''

  for (let r = 0; r < runs; r++) {
    const compiler = createCompiler(config, { crossFile: false })
    compiler.parseFileSource('/virtual/static.tsx', 'export const x = 1\n')
    const [emitMs, out] = timed(() => compiler.getLayerCss({ layers: [...LAYERS] }).css)
    emit.push(emitMs)
    css = out
  }

  return {
    emitMs: round(median(emit)),
    cssBytes: bytes(css),
    gzipBytes: gzip(css),
    containerBlocks: (css.match(/@container/g) ?? []).length,
  }
}
