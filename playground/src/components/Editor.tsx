import { css } from '@/design-system/css'
import { Flex } from '@/design-system/jsx'
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

export const Editor = (props: EditorProps) => {
  const { onChange, value, artifacts } = props

  const handleChange = (content = '', id: 'code' | 'config') => {
    onChange({
      ...value,
      [id]: content,
    })
  }

  const onMount: OnMount = useCallback(
    async (editor, monaco) => {
      editor.updateOptions({
        quickSuggestions: {
          strings: true,
          other: true,
          comments: true,
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
    [artifacts],
  )

  return (
    <Flex flex="1" direction="column" align="flex-start">
      <Tabs
        defaultValue={value.view}
        className={css({ flex: '1', width: 'full', display: 'flex', flexDirection: 'column' })}
      >
        <TabList
          className={css({
            px: '6',
            height: '12',
            borderBottomWidth: '1px',
            display: 'flex',
            alignItems: 'flex-end',
            gap: '3',
          })}
        >
          <TabTrigger value="code">
            <button>Code</button>
          </TabTrigger>
          <TabTrigger value="config">
            <button>Config</button>
          </TabTrigger>
          <TabIndicator className={css({ background: 'blue.500', height: '2px', mb: '-1px' })} />
        </TabList>
        <TabContent value="code" className={css({ flex: '1' })}>
          <MonacoEditor
            value={value.code}
            onChange={(e) => handleChange(e, 'code')}
            language="typescript"
            path="code.tsx"
            options={{ minimap: { enabled: false } }}
            onMount={onMount}
          />
        </TabContent>
        <TabContent value="config" className={css({ flex: '1' })}>
          <MonacoEditor
            value={value.config}
            onChange={(e) => handleChange(e, 'config')}
            language="typescript"
            path="config.ts"
            options={{ minimap: { enabled: false } }}
          />
        </TabContent>
      </Tabs>
    </Flex>
  )
}
