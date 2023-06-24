import { css } from '@/styled-system/css'
import { Flex } from '@/styled-system/jsx'
import { Artifact } from '@pandacss/types'
import { TabContent, TabIndicator, TabList, Tabs, TabTrigger } from '@ark-ui/react'
import MonacoEditor, { OnMount } from '@monaco-editor/react'
import { State } from './usePlayground'
import { useCallback } from 'react'

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

  const onCodeEditorMount: OnMount = useCallback(
    async (editor, monaco) => {
      await configureEditor(editor, monaco)

      const libs = artifacts.flatMap((artifact) => {
        if (!artifact) return []
        return artifact.files.map((file) => ({
          filePath: `file:///node_modules/${artifact.dir ? artifact.dir.join('/') + '/' : ''}${file.file}`,
          content: file.code ?? '',
        }))
      })

      for (const lib of libs) {
        monaco.languages.typescript.typescriptDefaults.addExtraLib(lib.content, lib.filePath)
      }

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
      ]

      await Promise.allSettled(
        typeSources.map(async (src) => {
          const res = await fetch(src.url)
          const content = await res.text()
          monaco.languages.typescript.typescriptDefaults.addExtraLib(content, src.filePath)
        }),
      )
    },
    [artifacts, configureEditor],
  )

  return (
    <Flex flex="1" direction="column" align="flex-start">
      <Tabs defaultValue="code" className={css({ flex: '1', width: 'full', display: 'flex', flexDirection: 'column' })}>
        <TabList
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
              _selected: {
                color: 'gray.900',
              },
            },
          })}
        >
          <TabTrigger value="code">Code</TabTrigger>
          <TabTrigger value="theme">Config</TabTrigger>
          <TabIndicator className={css({ background: 'yellow.400', height: '2px', mb: '-1px' })} />
        </TabList>
        <TabContent value="code" className={css({ flex: '1', pt: '4' })}>
          <MonacoEditor
            value={value.code}
            onChange={(e) => handleChange(e, 'code')}
            language="typescript"
            path="code.tsx"
            options={editorOptions}
            onMount={onCodeEditorMount}
          />
        </TabContent>
        <TabContent value="theme" className={css({ flex: '1' })}>
          <MonacoEditor
            value={value.config}
            onChange={(e) => handleChange(e, 'config')}
            language="typescript"
            path="config.ts"
            options={editorOptions}
            onMount={configureEditor}
          />
        </TabContent>
      </Tabs>
    </Flex>
  )
}
