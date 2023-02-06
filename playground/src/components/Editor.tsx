import { css } from '@/design-system/css'
import { Flex } from '@/design-system/jsx'
import { Artifact } from '@pandacss/types'
import { TabContent, TabIndicator, TabList, Tabs, TabTrigger } from '@ark-ui/react'
import MonacoEditor from '@monaco-editor/react'
import { State } from './usePlayground'

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

  return (
    <Flex flex="1" direction="column" align="flex-start">
      <Tabs defaultValue={value.view} className={css({ width: 'full' })}>
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
        <TabContent value="code">
          <MonacoEditor
            height="100vh"
            value={value.code}
            onChange={(e) => handleChange(e, 'code')}
            language="typescript"
            path="code.tsx"
            options={{ minimap: { enabled: false } }}
            onMount={(editor, monaco) => {
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

              const libs = artifacts.flatMap((a) => {
                if (!a) {
                  return []
                }

                return a.files.map((file) => ({
                  filePath: `file:///node_modules/${a.dir ? a.dir.join('/') + '/' : ''}${file.file}`,
                  content: file.code ?? '',
                }))
              })

              for (const lib of libs) {
                monaco.languages.typescript.typescriptDefaults.addExtraLib(lib.content, lib.filePath)
              }
            }}
          />
        </TabContent>
        <TabContent value="config">
          <MonacoEditor
            value={value.config}
            height="100vh"
            onChange={(e) => handleChange(e, 'config')}
            defaultLanguage="javascript"
            defaultValue="// some comment"
          />
        </TabContent>
      </Tabs>
    </Flex>
  )
}
