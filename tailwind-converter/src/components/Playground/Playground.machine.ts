import { extract, ExtractedComponentInstance, ExtractResultByName } from '@box-extractor/core'
import type { Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import type { Config } from 'tailwindcss'
import resolveConfig from 'tailwindcss/resolveConfig'
import { Node, Project, SourceFile, ts } from 'ts-morph'
import { assign, createMachine } from 'xstate'
import { choose } from 'xstate/lib/actions'
import { createTwParser } from '../../converter/tw'
import { initialInputList, initialOutputList } from './Playground.constants'

import { optimizeCss } from '@pandacss/core'
import MagicString from 'magic-string'
import postcss, { Root } from 'postcss'
import postcssJS from 'postcss-js'
import { createProject } from './createProject'
import { evalTheme } from './evalTheme'
import { maybePretty } from './maybePretty'

type TwResultItem = {
  classList: Set<string>
  css: string
  js: postcssJS.CssInJs
  query: ExtractedComponentInstance
  ast: Root
}

type PlaygroundContext = {
  monaco: Monaco | null
  inputEditor: editor.IStandaloneCodeEditor | null
  outputEditor: editor.IStandaloneCodeEditor | null
  sourceFile: SourceFile | null
  extracted: ExtractResultByName | null
  resultList: TwResultItem[]
  inputList: Record<string, string>
  selectedInput: string
  outputList: Record<string, string>
  selectedOutput: string
  decorations: string[]
}

type PlaygroundEvent =
  | {
      type: 'Editor Loaded'
      editor: editor.IStandaloneCodeEditor
      monaco: Monaco
      kind: 'input' | 'output'
    }
  | { type: 'Select input tab'; name: string }
  | { type: 'Select output tab'; name: string }
  | { type: 'Update input'; value: string }

const project: Project = createProject()

const initialContext: PlaygroundContext = {
  monaco: null,
  inputEditor: null,
  outputEditor: null,
  sourceFile: null,
  extracted: null,
  resultList: [],
  inputList: initialInputList,
  selectedInput: 'tw-App.tsx',
  outputList: initialOutputList,
  selectedOutput: 'panda-App.tsx',
  decorations: [],
}

globalThis.__dirname = '/'

export const playgroundMachine = createMachine(
  {
    predictableActionArguments: true,
    id: 'playground',
    tsTypes: {} as import('./Playground.machine.typegen').Typegen0,
    schema: {
      context: {} as PlaygroundContext,
      events: {} as PlaygroundEvent,
    },
    context: initialContext,
    initial: 'loading',
    states: {
      loading: {
        on: {
          'Editor Loaded': [
            {
              cond: 'willBeReady',
              target: 'ready',
              actions: ['assignEditorRef', 'extractClassList'],
            },
            { actions: 'assignEditorRef' },
          ],
        },
      },
      ready: {
        initial: 'Playing',
        entry: ['updateInput'],
        states: {
          Playing: {
            on: {
              'Select input tab': {
                actions: ['selectInputTab', 'updateInput'],
              },
              'Select output tab': { actions: ['selectOutputTab'] },
              'Update input': { actions: ['updateInput'] },
            },
          },
        },
      },
    },
  },
  {
    actions: {
      assignEditorRef: assign((ctx, event) => {
        if (event.kind === 'input') {
          return { ...ctx, inputEditor: event.editor, monaco: event.monaco }
        }

        return { ...ctx, outputEditor: event.editor, monaco: event.monaco }
      }),
      selectInputTab: assign((ctx, event) => {
        return { ...ctx, selectedInput: event.name }
      }),
      selectOutputTab: assign((ctx, event) => {
        return { ...ctx, selectedOutput: event.name }
      }),
      updateSelectedInput: assign((ctx, event) => {
        if (event.type !== 'Update input') return ctx

        // if (ctx.inputEditor) {
        // ctx.inputEditor.setValue(event.value);
        // }

        const { inputList, selectedInput } = ctx
        if (inputList[selectedInput]) {
          inputList[selectedInput] = event.value
        }
        return { ...ctx, inputList }
      }),
      updateInput: choose([
        {
          cond: 'isAppFile',
          actions: ['updateSelectedInput', 'extractClassList'],
        },
        { actions: ['updateSelectedInput'] },
      ]),
      extractClassList: assign((ctx, event) => {
        const value = event.type === 'Update input' ? event.value : ctx.inputEditor?.getValue() ?? ''
        const sourceFile = project.createSourceFile('App.tsx', value, {
          scriptKind: ts.ScriptKind.TSX,
          overwrite: true,
        })
        console.time('extract')
        const extracted = extract({
          ast: sourceFile,
          components: {
            matchTag: () => true,
            matchProp: ({ propName }) => ['class', 'className'].includes(propName),
          },
        })
        console.timeEnd('extract')

        console.time('resolveConfig')
        const themeContent = ctx.inputList['theme.ts'] ?? 'module.exports = {}'
        const evaluatedTheme = evalTheme(themeContent) ?? {}
        const userTheme = {
          ...evaluatedTheme,
          corePlugins: {
            ...evaluatedTheme.corePlugins,
            preflight: false,
          },
        }

        const config = resolveConfig(userTheme)
        console.timeEnd('resolveConfig')

        const parser = createTwParser(config as Config)
        const classListByInstance = new Map<ExtractedComponentInstance, { classList: Set<string>; node: Node }>()

        extracted.forEach((entry) => {
          ;(entry.queryList as ExtractedComponentInstance[]).forEach((query) => {
            const classList = new Set<string>()
            const classLiteral = query.box.value.get('className') ?? query.box.value.get('class')
            if (!classLiteral) return
            if (!classLiteral.isLiteral()) return
            if (typeof classLiteral.value !== 'string') return

            const classes = classLiteral.value.split(' ')
            classes.forEach((c) => classList.add(c))

            classListByInstance.set(query, {
              classList,
              node: classLiteral.getNode(),
            })
          })
        })

        const resultList = [] as TwResultItem[]
        const code = sourceFile.getFullText()
        const magicStr = new MagicString(code)

        console.time('tw parsing')
        classListByInstance.forEach(({ classList, node }, query) => {
          const parsed = parser(classList)
          const css = parsed.toString()
          const js = postcssJS.objectify(postcss.parse(css))

          resultList.push({ classList, css, js, query, ast: parsed })
          magicStr.update(
            node.getStart(),
            node.getEnd(),
            `{css(${JSON.stringify(postcssJS.objectify(postcss.parse(optimizeCss(css))), null, 2)})}`,
          )
        })
        console.timeEnd('tw parsing')

        const output = maybePretty(magicStr.toString())
        const outputList = {
          ['panda-App.tsx']: output,
          'transformed.md': resultList
            .map((result) => {
              return `// ${Array.from(result.classList).join(' ')}\n\`\`\`json\n${JSON.stringify(
                postcssJS.objectify(postcss.parse(optimizeCss(result.css))),
                null,
                2,
              )}\n\`\`\``
            })
            .join('\n\n//------------------------------------\n'),
        }
        console.log({
          extracted,
          config,
          resultList,
          output,
          editor: ctx.outputEditor,
          outputList,
        })

        // if (ctx.monaco && ctx.outputEditor) {
        //   ctx.outputEditor.setValue(output);
        // }

        return { ...ctx, sourceFile, extracted, resultList, outputList }
      }),
    },
    guards: {
      willBeReady: (ctx) => {
        return Boolean(ctx.inputEditor || ctx.outputEditor)
      },
      isAppFile: (ctx) => {
        return ctx.selectedInput === 'tw-App.tsx'
      },
    },
  },
)
