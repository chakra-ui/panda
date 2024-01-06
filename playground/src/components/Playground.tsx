'use client'
import { UsePlayGroundProps, usePlayground } from '@/src/hooks/usePlayground'
import { useConfig } from '@/src/hooks/useConfig'
import { PlaygroundContent } from '@/src/components/PlaygroundContent'

export const Playground = (props: UsePlayGroundProps) => {
  const playground = usePlayground(props)

  const _state = playground.diffState ?? playground.state

  const config = useConfig(_state.config)

  if (!config.config && !config.error) return null

  return <PlaygroundContent playground={playground} config={config} />
}
