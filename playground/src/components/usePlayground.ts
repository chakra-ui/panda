import { useState } from 'react'
import { Layout } from './LayoutControl'

export type State = {
  code: string
  theme: string
  view: string
}

export type UsePlayGroundProps = {
  intialState?: State | null
}

export const usePlayground = (props: UsePlayGroundProps) => {
  const { intialState } = props
  const [layout, setLayout] = useState<Layout>('horizontal')
  const [isPristine, setIsPristine] = useState(true)

  const [state, setState] = useState(
    intialState
      ? intialState
      : {
          code: `import { css } from 'design-system/css'

export const App = () => (
  <button
    className={css({
      color: 'red.400',
    })}
  >
    Hello world
  </button>
)
`,
          theme: `export const theme = {
  extend: {},
}`,
          view: 'code',
        },
  )
  const share = async () =>
    fetch('/api/share', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(state),
    })
      .then((response) => response.json())
      .then((data) => {
        history.pushState({ id: data.id }, '', data.id)
        setIsPristine(true)
      })

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
  }
}
