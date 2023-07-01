import { css } from '@/styled-system/css'
import { Flex } from '@/styled-system/jsx'
import { Artifact } from '@pandacss/types'

import MonacoEditor, { OnMount } from '@monaco-editor/react'
import { State } from './usePlayground'
import { useCallback, useRef, useState } from 'react'
import { useUpdateEffect } from 'usehooks-ts'

type EditorProps = {
  value: State
  onChange: (state: State) => void
  artifacts: Artifact[]
}

const editorOptions = {
  minimap: { enabled: false },
  fontSize: 14,
  quickSuggestions: {
    strings: true,
    other: true,
    comments: true,
  },
}

export const Editor = (props: EditorProps) => {
  const { onChange, value, artifacts } = props
  const [activeTab, setActiveTab] = useState<keyof State>('code')
  const monacoRef = useRef<Parameters<OnMount>[1]>()

  const handleChange = (content = '', id: 'code' | 'config') => {
    onChange({
      ...value,
      [id]: content,
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
        const prettier = await import('prettier/standalone')
        const typescript = await import('prettier/parser-typescript')
        const text = prettier.format(model.getValue(), {
          parser: 'typescript',
          plugins: [typescript],
          singleQuote: true,
        })

        return [
          {
            range: model.getFullModelRange(),
            text,
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

  const onCodeEditorMount: OnMount = useCallback(
    async (editor, monaco) => {
      monacoRef.current = monaco

      configureEditor(editor, monaco)
      setupLibs(monaco)

      // Get panda types
      type Files = { path: string; files: Files }[]
      async function fetchPandaTypes(): Promise<{ files: Files }> {
        const response = await fetch('https://unpkg.com/@pandacss/types@latest/?meta=true')
        const data = await response.json()
        return data
      }

      const data = await fetchPandaTypes()

      const distFiles = data.files.find((f) => f.path === '/dist')?.files ?? []
      const distFIleNames = distFiles.map((f) => f.path.replace('/dist/', ''))

      const pandaTypeSources = distFIleNames.map((dts) => ({
        url: `https://unpkg.com/@pandacss/types@latest/dist/${dts}`,
        filePath: `file:///node_modules/@pandacss/types/${dts}`,
      }))

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
    [configureEditor, setupLibs],
  )

  useUpdateEffect(() => {
    setupLibs(monacoRef.current!)
  }, [artifacts])

  return (
    <Flex flex="1" direction="column" align="flex-start">
      <div className={css({ flex: '1', width: 'full', display: 'flex', flexDirection: 'column' })}>
        <div
          className={css({
            px: '6',
            borderBottomWidth: '1px',
            display: 'flex',
            alignItems: 'flex-end',
            gap: '3',
            '& button': {
              py: '3',
              bg: 'transparent',
              fontWeight: 'medium',
              color: 'gray.500',
              borderBottom: 'solid 2px transparent',
              cursor: 'pointer',
              _selected: {
                borderBottomColor: 'yellow.400',
              },
            },
          })}
        >
          <button data-selected={activeTab === 'code' ? '' : undefined} onClick={() => setActiveTab('code')}>
            Code
          </button>
          <button data-selected={activeTab === 'config' ? '' : undefined} onClick={() => setActiveTab('config')}>
            Config
          </button>
        </div>
        <div className={css({ flex: '1', pt: '4' })}>
          <MonacoEditor
            value={value[activeTab]}
            onChange={(e) => handleChange(e, activeTab)}
            language="typescript"
            path={activeTab === 'code' ? 'code.tsx' : 'config.ts'}
            options={editorOptions}
            onMount={onCodeEditorMount}
          />
        </div>
      </div>
    </Flex>
  )
}
