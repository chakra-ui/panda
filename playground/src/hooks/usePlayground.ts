import { useState } from 'react'
import { Layout } from '../components/LayoutControl'

export type State = {
  code: string
  config: string
}

export type UsePlayGroundProps = {
  intialState?: State | null
}

export const usePlayground = (props: UsePlayGroundProps) => {
  const { intialState } = props
  const [layout, setLayout] = useState<Layout>('horizontal')
  const [isPristine, setIsPristine] = useState(true)
  const [isSharing, setIsSharing] = useState(false)

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
    setLayout,
    state,
    setState: (newState: State) => {
      setIsPristine(false)
      setState(newState)
    },
    share,
    isSharing,
  }
}
