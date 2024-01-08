import { OnMount, OnChange, BeforeMount, EditorProps, Monaco as MonacoType } from '@monaco-editor/react'
import * as Monaco from 'monaco-editor'
import { AutoTypings, LocalStorageCache } from 'monaco-editor-auto-typings/custom-editor'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocalStorage, useUpdateEffect } from 'usehooks-ts'

import { State } from './usePlayground'

import { pandaTheme } from '../lib/gruvbox-theme'
import { useTheme } from 'next-themes'
import { MonacoJsxSyntaxHighlight, getWorker } from 'monaco-jsx-syntax-highlight'

// @ts-ignore
import pandaDevDts from '../dts/@pandacss_dev.d.ts?raw'
// @ts-ignore
import pandaTypesDts from '../dts/@pandacss_types.d.ts?raw'
// @ts-ignore
import reactDts from '../dts/react.d.ts?raw'
import { useSearchParams } from 'next/navigation'
import { configureAutoImports } from '../lib/auto-import'
import { UsePanda } from '@/src/hooks/usePanda'
import { TypingsSourceResolver } from '@/src/lib/typings-source-resolver'

export interface PandaEditorProps {
  value: State
  onChange: (state: State) => void
  panda: UsePanda
  diffState?: State | null
  isLoading: boolean
}

type Tab = 'css' | 'code' | 'config'

export const defaultEditorOptions: EditorProps['options'] = {
  minimap: { enabled: false },
  fontSize: 13,
  quickSuggestions: {
    strings: true,
    other: true,
    comments: true,
  },
  guides: {
    indentation: false,
  },
  fontLigatures: true,
  fontFamily: "'Fira Code', 'Fira Mono', 'Menlo', 'Monaco', 'Courier', monospace",
  fontWeight: '400',
}

const activateAutoTypings = async (monacoEditor: Monaco.editor.IStandaloneCodeEditor, monaco: MonacoType) => {
  const activate = async () => {
    const { dispose } = await AutoTypings.create(monacoEditor, {
      monaco,
      sourceCache: new LocalStorageCache(),
      fileRootPath: 'file:///',
      debounceDuration: 500,
      sourceResolver: new TypingsSourceResolver(),
    })

    return dispose
  }

  activate()

  monacoEditor.onDidChangeModel(() => {
    activate()
  })

  monacoEditor.onDidChangeModelContent(() => {
    activate()
  })
}

const activateMonacoJSXHighlighter = async (monacoEditor: Monaco.editor.IStandaloneCodeEditor, monaco: MonacoType) => {
  const monacoJsxSyntaxHighlight = new MonacoJsxSyntaxHighlight(getWorker(), monaco)
  const uri = monacoEditor.getModel()?.uri

  const { highlighter, dispose } = monacoJsxSyntaxHighlight.highlighterBuilder({
    editor: monacoEditor,
    filePath: uri?.toString() ?? uri?.path,
  })

  highlighter()

  monacoEditor.onDidChangeModel(() => {
    highlighter()
  })

  monacoEditor.onDidChangeModelContent(() => {
    highlighter()
  })

  return dispose
}

export function useEditor(props: PandaEditorProps) {
  const { onChange, value, panda } = props

  const { artifacts, context } = panda

  const { resolvedTheme } = useTheme()

  const searchParams = useSearchParams()
  const initialTab = searchParams?.get('tab') as Tab | null
  const [activeTab, setActiveTab] = useState<Tab>(initialTab ?? 'code')

  const monacoEditorRef = useRef<Parameters<OnMount>[0]>()
  const monacoRef = useRef<Parameters<OnMount>[1]>()

  const [wordWrap, setWordwrap] = useLocalStorage<'on' | 'off'>('editor_wordWrap', 'off')

  const onToggleWrap = useCallback(() => {
    setWordwrap((prev) => (prev === 'on' ? 'off' : 'on'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    monacoEditorRef.current?.updateOptions({ wordWrap })
  }, [wordWrap])

  const autoImportCtx = useMemo(() => {
    return {
      patterns: context.patterns.details,
      recipes: Array.from(context.recipes.keys),
    }
  }, [context])

  const configureEditor: OnMount = useCallback(
    (editor, monaco) => {
      activateMonacoJSXHighlighter(editor, monaco)
      configureAutoImports({ context: autoImportCtx, monaco, editor })
      activateAutoTypings(editor, monaco)

      function registerKeybindings() {
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
          editor.trigger('editor', 'editor.action.formatDocument', undefined)
        })
        editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyZ, () => {
          // const wrapState = editor.getOption(monaco.editor.EditorOption.wordWrap)
          onToggleWrap()
        })
      }

      editor.onDidFocusEditorText(() => {
        // workaround for using multiple monaco editors on the same page
        // see https://github.com/microsoft/monaco-editor/issues/2947
        registerKeybindings()
      })

      //@ts-expect-error
      monaco.languages.css.cssDefaults.setOptions({ lint: { unknownAtRules: 'ignore' } })

      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.Latest,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        esModuleInterop: true,
        jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
        reactNamespace: 'React',
        allowJs: true,
        checkJs: true,
        strict: true,
        typeRoots: ['node_modules/@types'],
      })
    },
    [onToggleWrap, autoImportCtx],
  )

  const setupLibs = useCallback(
    (monaco: Parameters<OnMount>[1]) => {
      const libs = artifacts.flatMap((artifact) => {
        if (!artifact) return []
        return artifact.files.map((file) => ({
          filePath: `file:///node_modules/${artifact.dir ? artifact.dir.join('/') + '/' : ''}${file.file}`,
          content: file.code ?? '',
        }))
      })

      return libs.map((lib) => monaco?.languages.typescript.typescriptDefaults.addExtraLib(lib.content, lib.filePath))
    },
    [artifacts],
  )

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const getPandaTypes = useCallback(async () => {}, [])

  const onBeforeMount: BeforeMount = (monaco) => {
    monaco.editor.defineTheme('panda-dark', pandaTheme)
  }

  useEffect(() => {
    monacoRef.current?.editor.setTheme(resolvedTheme === 'dark' ? 'panda-dark' : 'vs')
  }, [monacoRef, resolvedTheme])

  const onCodeEditorMount: OnMount = useCallback(
    async (editor, monaco) => {
      if (resolvedTheme === 'dark') monaco.editor.setTheme('panda-dark')
      monacoRef.current = monaco
      monacoEditorRef.current = editor

      configureEditor(editor, monaco)
      setupLibs(monaco)

      const typeSources = [
        {
          content: reactDts,
          filePath: 'file:///node_modules/@types/react/index.d.ts',
        },
        {
          content: "// Expose `JSX` namespace in `global` namespace\nimport './';\n",
          filePath: 'file:///node_modules/@types/react/jsx-runtime.d.ts',
        },
        {
          content: pandaDevDts,
          filePath: 'file:///node_modules/@pandacss/dev/index.d.ts',
        },
        {
          content: pandaTypesDts,
          filePath: 'file:///node_modules/@pandacss/types/index.d.ts',
        },
      ]

      typeSources.map((src) => {
        monaco.languages.typescript.typescriptDefaults.addExtraLib(src.content, src.filePath)
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [configureEditor, setupLibs, getPandaTypes],
  )

  const onCodeEditorChange = (content: Parameters<OnChange>[0]) => {
    onChange({
      ...value,
      [activeTab]: content,
    })
  }

  const onCodeEditorFormat = () => {
    monacoEditorRef.current?.getAction('editor.action.formatDocument')?.run()
  }

  useUpdateEffect(() => {
    const libsSetup = setupLibs(monacoRef.current!)

    return () => {
      for (const lib of libsSetup) {
        lib?.dispose()
      }
    }
  }, [artifacts])

  useUpdateEffect(() => {
    const autoImports = configureAutoImports({
      context: autoImportCtx,
      monaco: monacoRef.current!,
      editor: monacoEditorRef.current!,
    })

    return () => {
      autoImports?.dispose()
    }
  }, [context])

  return {
    activeTab,
    setActiveTab,
    onBeforeMount,
    onCodeEditorChange,
    onCodeEditorMount,
    onCodeEditorFormat,
    onToggleWrap,
    wordWrap,
  }
}
