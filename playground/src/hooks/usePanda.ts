import { artifactsPreviewJs, toLegacyArtifacts, type LegacyArtifact } from '@/src/lib/compiler/artifacts'
import { PandaContext, usePandaContext } from '@/src/hooks/usePandaContext'
import { State } from '@/src/hooks/usePlayground'
import type { Compiler, ExtractResult, WasmModule } from '@pandacss/compiler-wasm/web'
import type { Config } from '@pandacss/types'
import { useMemo, useRef } from 'react'
import { useDebounceValue } from 'usehooks-ts'

/**
 * How many recent source versions to keep parsed. Re-parsing the same path
 * *replaces* its atoms, so each edit is staged under a fresh path and the
 * stylesheet accumulates — like the PostCSS/Vite plugin's append-only dev
 * sheet. Old classes stay around so changing a property never momentarily
 * un-styles an element (no flicker). The window caps unbounded growth.
 */
const HISTORY_LIMIT = 25

interface SourceHistory {
  compiler: Compiler | null
  paths: string[]
  counter: number
  lastSource: string | null
}

export function usePanda(mod: WasmModule | null, state: State, config: Config | null) {
  const [source] = useDebounceValue(state.code, 150)
  const [css] = useDebounceValue(state.css, 150)

  const context = usePandaContext(mod, config)
  const compiler = context.compiler
  const history = useRef<SourceHistory>({ compiler: null, paths: [], counter: 0, lastSource: null })

  // Codegen artifacts depend only on the config (compiler), not the source.
  const { artifacts, previewJs } = useMemo(() => {
    if (!compiler) return { artifacts: [] as LegacyArtifact[], previewJs: '' }
    const artifacts = toLegacyArtifacts(compiler.generateArtifacts())
    return { artifacts, previewJs: artifactsPreviewJs(artifacts) }
  }, [compiler])

  return useMemo(() => {
    if (!compiler) {
      return {
        previewCss: css,
        artifacts,
        previewJs,
        parserResult: null as ExtractResult | null,
        cssArtifacts: [] as CssFileArtifact[],
        context,
      }
    }

    const path = stageSource(compiler, history.current, source)
    let parserResult: ExtractResult | null = null
    try {
      // Current-source calls/jsx (with style data) for the AST panel.
      parserResult = compiler.extractFileSource(path, source)
    } catch (error) {
      console.log(error)
    }

    const cssArtifacts: CssFileArtifact[] = [
      { file: 'Utilities', code: compiler.layerCss(['utilities']) },
      { file: 'Recipes', code: compiler.layerCss(['recipes']) },
      { file: 'Tokens', code: compiler.layerCss(['tokens']) },
      { file: 'Reset', code: compiler.layerCss(['reset']) },
      { file: 'Global', code: compiler.layerCss(['base']) },
    ]

    const previewCss = [css, compiler.compile().css].join('\n')

    return { previewCss, artifacts, previewJs, parserResult, cssArtifacts, context }
  }, [source, css, context, compiler, artifacts, previewJs])
}

/** Parse `source` under a fresh path so its atoms accumulate; returns the path
 *  to use for the current-source extraction. Resets when the compiler (config)
 *  changes, and evicts the oldest version past {@link HISTORY_LIMIT}. */
function stageSource(compiler: Compiler, history: SourceHistory, source: string): string {
  if (history.compiler !== compiler) {
    history.compiler = compiler
    history.paths = []
    history.counter = 0
    history.lastSource = null
  }

  // Identical source — keep the current head, don't churn the window.
  if (history.lastSource === source && history.paths.length > 0) {
    return history.paths[history.paths.length - 1]
  }

  const path = `code-${history.counter++}.tsx`
  compiler.parseFileSource(path, source)
  history.paths.push(path)
  history.lastSource = source

  while (history.paths.length > HISTORY_LIMIT) {
    const stale = history.paths.shift()
    if (stale) compiler.removeFile(stale)
  }

  return path
}

export interface CssFileArtifact {
  file: string
  code: string | undefined
  dir?: string[] | undefined
}

export type UsePanda = ReturnType<typeof usePanda>
export type { PandaContext }
