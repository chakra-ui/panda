import { EXAMPLES, Example } from '@/src/components/Examples/data'
import { parseState } from '@/src/lib/parse-state'
import { SplitterRootProps } from '@ark-ui/react/splitter'
import { startTransition, useDeferredValue, useMemo, useRef, useState } from 'react'
import { Layout } from '../components/LayoutControl'
import { toaster } from '../components/ToastProvider'
import { flushSync } from 'react-dom'

export interface State {
  code: string
  config: string
  css: string
  id?: string | null
}

export interface UsePlayGroundProps {
  initialState?: State | null
  diffState?: State | null
}

export const usePlayground = (props: UsePlayGroundProps) => {
  const [layout, setLayout] = useState<Extract<Layout, 'horizontal' | 'vertical'>>('horizontal')
  const [isPristine, setIsPristine] = useState(true)
  const [isSharing, setIsSharing] = useState(false)
  const [isResponsive, setIsResponsive] = useState(false)

  const panels = useMemo(() => {
    return [{ id: 'left', minSize: 15 }, { id: 'preview' }]
  }, [])

  const [panelSize, setPanelSizeImpl] = useState([50, 50])
  const isPreviewMode = panelSize[0] === 0

  const layoutValue = isPreviewMode ? ('preview' as const) : layout

  const setPanelSize = (size: number[]) => {
    flushSync(() => {
      setPanelSizeImpl(size)
    })
  }

  const onResizePanels: SplitterRootProps['onResize'] = (e) => setPanelSize(e.size)

  const switchLayout = (layout: Layout) => {
    if (layout === 'responsive') {
      setIsResponsive((p) => !p)
      return
    }

    if (layout === 'preview') {
      setLayout('horizontal')
      setPanelSize([0, 100])
      return
    }

    setLayout(layout)
    if (isPreviewMode) {
      setPanelSize([50, 50])
    }
  }

  const { code, config } = EXAMPLES.find((example) => example.id === 'css')!

  const example = {
    code,
    config,
  }

  const pristineState = useRef(props.initialState)
  const [state, setState] = useState(props.initialState ?? parseState(example))
  const deferredState = useDeferredValue(state)
  const [diffState, setDiffState] = useState(props.diffState)

  function copyCurrentURI() {
    const currentURI = window.location.href
    navigator.clipboard.writeText(currentURI)
  }

  const share = async ({ onDone }: { onDone: (id: string) => void }) => {
    setIsSharing(true)
    fetch('/api/share', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(state),
    })
      .then((response) => response.json())
      .then(({ data }) => {
        onDone(data.id)
        copyCurrentURI()
        toaster.success({
          title: 'Playground saved.',
          description: 'Link copied to clipboard.',
          duration: 3000,
        })
        setIsPristine(true)
        setIsSharing(false)
      })
      .catch(() => {
        toaster.error({
          title: 'Could not save playground.',
          description: 'Please try again.',
          duration: 3000,
        })
        setIsSharing(false)
      })
  }

  const onShare = async () => {
    share({
      onDone(id) {
        history.pushState({ id }, '', id)
        setState((prev) => Object.assign({}, prev, { id }))
      },
    })
    pristineState.current = state
  }

  const onShareDiff = () => {
    if (!state.id) return

    share({
      onDone(id) {
        history.pushState({ id }, '', `${state.id}/${id}`)
        if (!pristineState.current) return
        setDiffState(Object.assign({}, state, { id }))
        setState(pristineState.current)
      },
    })
  }

  const setExample = (_example: Example) => {
    const example = EXAMPLES.find((example) => example.id === _example)
    if (!example) return
    setIsPristine(true)
    setState(
      parseState({
        code: example.code,
        config: example.config,
      }),
    )
  }

  return {
    isPristine,
    layout,
    layoutValue,
    isPreviewMode,
    panels,
    panelSize,
    setPanelSize,
    onResizePanels,
    switchLayout,
    state: deferredState,
    setState: (newState: State) => {
      setIsPristine(false)
      startTransition(() => {
        setState(newState)
      })
    },
    setExample,
    onShare,
    onShareDiff,
    diffState,
    isSharing,
    isResponsive,
  }
}

export type UsePlayground = ReturnType<typeof usePlayground>
