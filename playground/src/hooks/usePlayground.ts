import { useState } from 'react'
import { Layout } from '../components/LayoutControl'
import { SplitterProps, useToast } from '@ark-ui/react'

export type State = {
  code: string
  config: string
}

export type UsePlayGroundProps = {
  intialState?: State | null
}

export const usePlayground = (props: UsePlayGroundProps) => {
  const { intialState } = props
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

  const [state, setState] = useState(
    intialState
      ? intialState
      : {
          code: `import { css } from 'styled-system/css'

export const App = () => {
  return (
    <>
      <button
        className={css({
          color: 'red.400',
        })}
      >
        Hello world
      </button>
    </>
  )
}
`,
          config: `import { defineConfig } from '@pandacss/dev';

export const config = defineConfig({
  theme: { extend: {} },
  globalCss: {
    html: {
      h: 'full',
    },
    body: {
      bg: { base: 'white', _dark: '#2C2C2C' },
    },
  },
  jsxFramework: 'react',
});    
          
`,
        },
  )

  function copyCurrentURI() {
    const currentURI = window.location.href
    navigator.clipboard.writeText(currentURI).then(() => {
      // Current URI successfully copied to clipboard
      console.log('Current URI copied to clipboard:', currentURI)
    })
  }

  const onShare = async () => {
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
        history.pushState({ id: data.id }, '', data.id)
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
      setIsPristine(false)
      setState(newState)
    },
    onShare,
    isSharing,
    isResponsive,
  }
}
