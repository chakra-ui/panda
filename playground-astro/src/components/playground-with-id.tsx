import { useEffect } from 'react'
import { Playground } from './playground'
import { Providers } from './providers'
import { usePlayground } from '@/hooks/use-playground'

interface PlaygroundWithIdProps {
  id: string
}

const PlaygroundWithIdInner = (props: PlaygroundWithIdProps) => {
  const ctx = usePlayground()

  useEffect(() => {
    const fetchState = async () => {
      const res = await fetch(`/api/session/${props.id}.json`)
      const state = await res.json()
      ctx.setState(state)
    }

    fetchState()
  }, [props.id])

  return (
    <Providers>
      <Playground {...ctx} />
    </Providers>
  )
}

export const PlaygroundWithId = (props: PlaygroundWithIdProps) => {
  return (
    <Providers>
      <PlaygroundWithIdInner {...props} />
    </Providers>
  )
}
