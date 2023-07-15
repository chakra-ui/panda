import { OnMount, OnChange, BeforeMount } from '@monaco-editor/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useUpdateEffect } from 'usehooks-ts'

import { Artifact } from '@pandacss/types'
import { State } from './usePlayground'

import { pandaTheme } from '../lib/gruvbox-theme'
import { useTheme } from 'next-themes'

export type PandaEditorProps = {
  value: State
  onChange: (state: State) => void
  artifacts: Artifact[]
}

export function useEditor(props: PandaEditorProps) {
  const { onChange, value, artifacts } = props
  const { resolvedTheme } = useTheme()

  const [activeTab, setActiveTab] = useState<keyof State>('code')
  const monacoRef = useRef<Parameters<OnMount>[1]>()

  const formatText = async (text: string) => {
    const prettier = await import('prettier/standalone')
    const typescript = await import('prettier/parser-typescript')
    return prettier.format(text, {
      parser: 'typescript',
      plugins: [typescript],
      singleQuote: true,
    })
  }

  const configureEditor: OnMount = useCallback((editor, monaco) => {
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

    monaco.languages.registerDocumentFormattingEditProvider('typescript', {
      async provideDocumentFormattingEdits(model) {
        return [
          {
            range: model.getFullModelRange(),
            text: formatText(model.getValue()),
          },
        ]
      },
    })

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

  const getPandaTypes = useCallback(async () => {
    type Files = { path: string; files: Files }[]

    async function fetchPandaTypes(): Promise<{ files: Files }> {
      const response = await fetch('https://unpkg.com/@pandacss/types@latest/?meta=true')
      const data = await response.json()
      return data
    }

    const data = await fetchPandaTypes()

    const distFiles = data.files.find((f) => f.path === '/dist')?.files ?? []
    const distFIleNames = distFiles.map((f) => f.path.replace('/dist/', ''))

    return distFIleNames.map((dts) => ({
      url: `https://unpkg.com/@pandacss/types@latest/dist/${dts}`,
      filePath: `file:///node_modules/@pandacss/types/${dts}`,
    }))
  }, [])

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

      configureEditor(editor, monaco)
      setupLibs(monaco)

      const pandaTypeSources = await getPandaTypes()

      const reactTypesVersion = '18.0.27'
      const typeSources = [
        {
          url: `https://unpkg.com/@types/react@${reactTypesVersion}/index.d.ts`,
          filePath: 'file:///node_modules/@types/react/index.d.ts',
        },
        {
          url: `https://unpkg.com/@types/react@${reactTypesVersion}/jsx-runtime.d.ts`,
          filePath: 'file:///node_modules/@types/react/jsx-runtime.d.ts',
        },
        {
          url: `https://unpkg.com/@types/react@${reactTypesVersion}/global.d.ts`,
          filePath: 'file:///node_modules/@types/react/global.d.ts',
        },
        {
          url: `https://unpkg.com/@pandacss/dev@latest/dist/index.d.ts`,
          filePath: 'file:///node_modules/@pandacss/dev/index.d.ts',
        },
        ...pandaTypeSources,
      ]

      await Promise.allSettled(
        typeSources.map(async (src) => {
          const res = await fetch(src.url)
          const content = await res.text()
          monaco.languages.typescript.typescriptDefaults.addExtraLib(content, src.filePath)
        }),
      )
    },
    [configureEditor, setupLibs, getPandaTypes],
  )

  const onCodeEditorChange: OnChange = (content) => {
    onChange({
      ...value,
      [activeTab]: content,
    })
  }

  const onCodeEditorFormat = async () => {
    onCodeEditorChange(await formatText(value[activeTab]))
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
