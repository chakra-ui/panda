import { useState } from 'react'
import { type Layout } from '../components/toolbar/layout-control'
import { type SplitterProps, useToast } from '@ark-ui/react'
import { EXAMPLES, type Example } from '@/components/examples/data'
import { UrlSaver } from '@/utils/url-saver'

export type State = {
  code: string
  config: string
}

export type UsePlayGroundProps = {
  initialState?: State | null
}

export interface UsePlaygroundReturn extends ReturnType<typeof usePlayground> {}

const urlSaver = new UrlSaver<State>()
const noop = () => {}

const cssExample = EXAMPLES.find((example) => example.id === 'css')!
const getInitialState = (props: UsePlayGroundProps['initialState']): State => {
  console.log()
  if (props) return props
  if (urlSaver.get('code') || urlSaver.get('config')) {
    return {
      code: urlSaver.get('code') ?? '',
      config: urlSaver.get('config') ?? '',
    }
  }

  return cssExample
}

export const usePlayground = (props?: UsePlayGroundProps) => {
  const [layout, setLayout] =
    useState<Extract<Layout, 'horizontal' | 'vertical'>>('horizontal')
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

  const onResizePanels: SplitterProps['onResize'] = (e) =>
    setPanels(e.size as any)

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

  const [state, setState] = useState(getInitialState(props?.initialState))

  function copyCurrentURI() {
    const currentURI = window.location.href
    navigator.clipboard.writeText(currentURI).then(() => {
      // Current URI successfully copied to clipboard
      console.log('Current URI copied to clipboard:', currentURI)
    })
  }

  const onShare = async () => {
    setIsSharing(true)

    const storeSessionState = () => {
      return fetch('/api/share.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      })
        .then((response) => response.json())
        .then(({ data }) => {
          history.pushState({ id: data.id }, '', data.id)
        })
    }

    urlSaver
      .setAll(state, storeSessionState)
      ?.then(() => {
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

  const setExample = (_example: Example) => {
    const example = EXAMPLES.find((example) => example.id === _example)
    if (!example) return
    setIsPristine(true)
    setState({
      code: example.code,
      config: example.config,
    })
    urlSaver.setAll(example, noop)
  }

  return {
    isPristine,
    layout,
    layoutValue,
    isPreviewMode,
    panels,
    onResizePanels,
    switchLayout,
    state,
    setState: (newState: State) => {
      if (newState.code !== state.code) {
        urlSaver.set('code', newState.code, noop)
      } else if (newState.config !== state.config) {
        urlSaver.set('config', newState.config, noop)
      }

      setIsPristine(false)
      setState(newState)
    },
    setExample,
    onShare,
    isSharing,
    isResponsive,
  }
}
