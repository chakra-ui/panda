import { UsePanda } from '@/src/hooks/usePanda'
import { TypingsSourceResolver } from '@/src/lib/typings-source-resolver'
import { BeforeMount, EditorProps, Monaco as MonacoType, OnChange, OnMount } from '@monaco-editor/react'
import * as Monaco from 'monaco-editor'
import { AutoTypings, LocalStorageCache } from 'monaco-editor-auto-typings/custom-editor'
import { MonacoJsxSyntaxHighlight, getWorker } from 'monaco-jsx-syntax-highlight'
import { useTheme } from 'next-themes'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocalStorage, useUpdateEffect } from 'usehooks-ts'
import { configureAutoImports } from '../lib/auto-import'
import { pandaTheme } from '../lib/gruvbox-theme'
import { State } from './usePlayground'

// @ts-ignore
import pandaDevDts from '../dts/@pandacss_dev.d.ts?raw'
// @ts-ignore
import pandaTypesDts from '../dts/@pandacss_types.d.ts?raw'
// @ts-ignore
import reactDts from '../dts/react.d.ts?raw'

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
  // AutoTypings internally watches for content changes via debounceDuration
  // No need for additional event handlers - they cause duplicate instances
  const { dispose } = await AutoTypings.create(monacoEditor, {
    monaco,
    sourceCache: new LocalStorageCache(),
    fileRootPath: 'file:///',
    debounceDuration: 500,
    sourceResolver: new TypingsSourceResolver(),
  })

  return dispose
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

  const monacoEditorRef = useRef<Parameters<OnMount>[0] | undefined>(undefined)
  const monacoRef = useRef<Parameters<OnMount>[1] | undefined>(undefined)

  // Track the last known value for external change detection
  // We use refs to avoid re-renders - Monaco manages its own state (uncontrolled)
  const lastValueRef = useRef(value)
  const isUserEditRef = useRef(false)

  const [wordWrap, setWordwrap] = useLocalStorage<'on' | 'off'>('editor_wordWrap', 'off')

  const onToggleWrap = useCallback(() => {
    setWordwrap((prev) => (prev === 'on' ? 'off' : 'on'))
  }, [])

  useEffect(() => {
    monacoEditorRef.current?.updateOptions({ wordWrap })
  }, [wordWrap])

  // Memoize based on actual data, not context reference, to prevent unnecessary re-renders
  const patterns = context.patterns.details
  const recipeKeys = context.recipes.keys
  const autoImportCtx = useMemo(() => {
    return {
      patterns,
      recipes: Array.from(recipeKeys),
    }
  }, [patterns, recipeKeys])

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
          onToggleWrap()
        })
      }

      editor.onDidFocusEditorText(() => {
        // workaround for using multiple monaco editors on the same page
        // see https://github.com/microsoft/monaco-editor/issues/2947
        registerKeybindings()
      })

      //@ts-expect-error - monaco types are not fully compatible with the latest version
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
        return artifact.files.map((file) => {
          // Patch FunctionComponent types for React 19 compatibility in Monaco
          let content = file.code ?? ''
          if (file.file.endsWith('.d.ts')) {
            content = content.replace(
              /export declare const (\w+): FunctionComponent<(\w+)>/g,
              'export declare const $1: (props: $2) => JSX.Element',
            )
          }

          return {
            filePath: `file:///node_modules/${artifact.dir ? artifact.dir.join('/') + '/' : ''}${file.file}`,
            content,
          }
        })
      })

      return libs.map((lib) => monaco?.languages.typescript.typescriptDefaults.addExtraLib(lib.content, lib.filePath))
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
          content: `import * as React from "./";
export { Fragment } from "./";

export namespace JSX {
  type ElementType = React.JSX.ElementType;
  interface Element extends React.JSX.Element {}
  interface ElementClass extends React.JSX.ElementClass {}
  interface ElementAttributesProperty extends React.JSX.ElementAttributesProperty {}
  interface ElementChildrenAttribute extends React.JSX.ElementChildrenAttribute {}
  type LibraryManagedAttributes<C, P> = React.JSX.LibraryManagedAttributes<C, P>;
  interface IntrinsicAttributes extends React.JSX.IntrinsicAttributes {}
  interface IntrinsicClassAttributes<T> extends React.JSX.IntrinsicClassAttributes<T> {}
  interface IntrinsicElements extends React.JSX.IntrinsicElements {}
}

export function jsx(type: React.ElementType, props: unknown, key?: React.Key): React.ReactElement;
export function jsxs(type: React.ElementType, props: unknown, key?: React.Key): React.ReactElement;
`,
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
    [configureEditor, setupLibs, getPandaTypes],
  )

  // Use ref to track current value for onChange - keeps callback stable
  const stateRef = useRef({ value: lastValueRef.current, activeTab })
  stateRef.current = { value: lastValueRef.current, activeTab }

  const onCodeEditorChange = useCallback(
    (content: Parameters<OnChange>[0]) => {
      const { value: currentValue, activeTab: currentTab } = stateRef.current
      const newValue = { ...currentValue, [currentTab]: content }
      // Mark as user edit to skip sync effect
      isUserEditRef.current = true
      lastValueRef.current = newValue
      onChange(newValue)
    },
    [onChange],
  )

  const onCodeEditorFormat = () => {
    monacoEditorRef.current?.getAction('editor.action.formatDocument')?.run()
  }

  // Track previous artifacts to avoid unnecessary lib updates that cause cursor jumps
  const prevArtifactsRef = useRef<string>('')
  const libsDisposablesRef = useRef<ReturnType<typeof setupLibs>>([])

  useUpdateEffect(() => {
    // Create a signature of the artifact type definitions to detect actual changes
    const dtsSignature = artifacts
      .flatMap((a) => a?.files.filter((f) => f.file.endsWith('.d.ts')).map((f) => f.code) ?? [])
      .join('')

    // Skip if the type definitions haven't actually changed
    if (prevArtifactsRef.current === dtsSignature) return
    prevArtifactsRef.current = dtsSignature

    // Dispose previous libs before setting up new ones
    for (const lib of libsDisposablesRef.current) {
      lib?.dispose()
    }

    libsDisposablesRef.current = setupLibs(monacoRef.current!)

    return () => {
      for (const lib of libsDisposablesRef.current) {
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
  }, [autoImportCtx])

  // Sync external changes (example selection) via editor.setValue()
  // This is the key to uncontrolled mode - we don't use value prop, we call setValue directly
  useEffect(() => {
    // Skip if this change came from user editing (our own onChange)
    if (isUserEditRef.current) {
      isUserEditRef.current = false
      return
    }

    // Only update if content actually changed
    const editor = monacoEditorRef.current
    if (!editor) return

    const currentContent = value[activeTab as keyof Pick<State, 'code' | 'config' | 'css'>]
    const editorContent = editor.getValue()

    if (currentContent !== editorContent) {
      // Save cursor position
      const position = editor.getPosition()
      const scrollTop = editor.getScrollTop()

      // Update editor content directly
      editor.setValue(currentContent ?? '')

      // Restore cursor position
      if (position) {
        editor.setPosition(position)
      }
      editor.setScrollTop(scrollTop)
    }

    // Update ref
    lastValueRef.current = value
  }, [value.code, value.config, value.css, activeTab])

  return {
    activeTab,
    setActiveTab,
    onBeforeMount,
    onCodeEditorChange,
    onCodeEditorMount,
    onCodeEditorFormat,
    onToggleWrap,
    wordWrap,
    // Return initial value for defaultValue prop
    immediateValue: value,
  }
}
