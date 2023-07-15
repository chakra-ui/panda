import { useState } from 'react'
import { Layout } from '../components/LayoutControl'
import { SplitterProps } from '@ark-ui/react'

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
    if (layout === 'preview') {
      setLayout('horizontal')
      setPanelSize('left', 0)
    } else {
      setLayout(layout)
      if (isPreviewMode) {
        setPanelSize('preview', 50)
        setPanelSize('left', 50)
      }
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
      bg: { _dark: '#2C2C2C' },
    },
  },
});    
          
`,
        },
  )
  const share = async () => {
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
        setIsPristine(true)
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
    share,
    isSharing,
  }
}
