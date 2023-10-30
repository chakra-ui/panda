import { usePlayground } from '@/hooks/use-playground'
import { EXAMPLES } from './examples/data'
import { Playground } from './playground'
import { Providers } from './providers'

const initialState = EXAMPLES.find((ex) => ex.id === 'css')

const PlaygroundWithDefaultInner = () => {
  const ctx = usePlayground({ initialState })

  return <Playground {...ctx} />
}

export const PlaygroundWithDefault = () => {
  return (
    <Providers>
      <PlaygroundWithDefaultInner />
    </Providers>
  )
}
