import { usePlayground } from '@/hooks/use-playground'
import { Playground } from './playground'
import { Providers } from './providers'

const PlaygroundWithDefaultInner = () => {
  const ctx = usePlayground()

  return <Playground {...ctx} />
}

export const PlaygroundWithDefault = () => {
  return (
    <Providers>
      <PlaygroundWithDefaultInner />
    </Providers>
  )
}
