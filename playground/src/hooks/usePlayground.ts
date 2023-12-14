import { startTransition, useDeferredValue, useRef, useState } from 'react'
import { Layout } from '../components/LayoutControl'
import { SplitterProps, useToast } from '@ark-ui/react'
import { EXAMPLES, Example } from '@/src/components/Examples/data'
import { parseState } from '@/src/lib/parse-state'

export type State = {
  code: string
  config: string
  css: string
  id?: string | null
}

export type UsePlayGroundProps = {
  initialState?: State | null
  diffState?: State | null
}

export const usePlayground = (props: UsePlayGroundProps) => {
  const [layout, setLayout] = useState<Extract<Layout, 'horizontal' | 'vertical'>>('horizontal')
  const [isPristine, setIsPristine] = useState(true)
  const [isSharing, setIsSharing] = useState(false)
  const [isResponsive, setIsResponsive] = useState(false)
  const toast = useToast()

  const [panels, setPanels] = useState([
    { id: 'left', size: 50, minSize: 15 },
    { id: 'preview', size: 50 },
  ])

  const isPreviewMode = panels.find((panel) => panel.id === 'left')?.size === 0

  const layoutValue = isPreviewMode ? ('preview' as const) : layout

  const onResizePanels: SplitterProps['onResize'] = (e) => setPanels(e.size as any)

  function setPanelSize(id: string, size: number) {
    setPanels((prevPanels) => {
      return prevPanels.map((panel) => {
        return panel.id === id ? { ...panel, size } : panel
      })
    })
  }

  const switchLayout = (layout: Layout) => {
    if (layout === 'responsive') {
      setIsResponsive((p) => !p)
      return
    }

    if (layout === 'preview') {
      setLayout('horizontal')
      setPanelSize('left', 0)
      return
    }

    setLayout(layout)
    if (isPreviewMode) {
      setPanelSize('preview', 50)
      setPanelSize('left', 50)
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
    navigator.clipboard.writeText(currentURI).then(() => {
      // Current URI successfully copied to clipboard
      console.log('Current URI copied to clipboard:', currentURI)
    })
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
        toast.success({
          title: 'Playground saved.',
          description: 'Link copied to clipboard.',
          placement: 'top',
          duration: 3000,
        })
        setIsPristine(true)
        setIsSharing(false)
      })
      .catch(() => {
        toast.error({
          title: 'Could not save playground.',
          description: 'Please try again.',
          placement: 'top',
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
        console.log('pristineState', pristineState)
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
