import { OnMount, OnChange, BeforeMount, EditorProps } from '@monaco-editor/react'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
//@ts-expect-error
import MonacoJSXHighlighter from 'monaco-jsx-highlighter'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useUpdateEffect } from 'usehooks-ts'

import { Artifact } from '@pandacss/types'
import { State } from './usePlayground'

import { pandaTheme } from '../lib/gruvbox-theme'
import { useTheme } from 'next-themes'

// @ts-ignore
import pandaDevDts from '../dts/@pandacss_dev.d.ts?raw'
// @ts-ignore
import pandaTypesDts from '../dts/@pandacss_types.d.ts?raw'
// @ts-ignore
import reactDts from '../dts/react.d.ts?raw'
export interface PandaEditorProps {
  value: State
  onChange: (state: State) => void
  artifacts: Artifact[]
}

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

export function useEditor(props: PandaEditorProps) {
  const { onChange, value, artifacts } = props
  const { resolvedTheme } = useTheme()

  const [activeTab, setActiveTab] = useState<keyof State>('code')
  const monacoEditorRef = useRef<Parameters<OnMount>[0]>()
  const monacoRef = useRef<Parameters<OnMount>[1]>()

  const configureEditor: OnMount = useCallback((editor, monaco) => {
    // Instantiate the highlighter
    const monacoJSXHighlighter = new MonacoJSXHighlighter(monaco, parse, traverse, editor)
    // Activate highlighting (debounceTime default: 100ms)
    monacoJSXHighlighter.highlightOnDidChangeModelContent()
    // Activate JSX commenting
    monacoJSXHighlighter.addJSXCommentCommand()

    function registerKeybindings() {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        editor.trigger('editor', 'editor.action.formatDocument', undefined)
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
  }, [])

  const setupLibs = useCallback(
    (monaco: Parameters<OnMount>[1]) => {
      const libs = artifacts.flatMap((artifact) => {
        if (!artifact) return []
        return artifact.files.map((file) => ({
          filePath: `file:///node_modules/${artifact.dir ? artifact.dir.join('/') + '/' : ''}${file.file}`,
          content: file.code ?? '',
        }))
      })

      for (const lib of libs) {
        monaco?.languages.typescript.typescriptDefaults.addExtraLib(lib.content, lib.filePath)
      }
    },
    [artifacts],
  )

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
    setupLibs(monacoRef.current!)
  }, [artifacts])

  return {
    activeTab,
    setActiveTab,
    onBeforeMount,
    onCodeEditorChange,
    onCodeEditorMount,
    onCodeEditorFormat,
  }
}
