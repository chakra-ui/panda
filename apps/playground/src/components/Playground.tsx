'use client'
import { UsePlayGroundProps, usePlayground } from '@/src/hooks/usePlayground'
import { useConfig } from '@/src/hooks/useConfig'
import dynamic from 'next/dynamic'

// Client-only: the editor tree pulls in `monaco-editor`, which touches `window`
// at import time and cannot be server-rendered.
const PlaygroundContent = dynamic(
  () => import('@/src/components/PlaygroundContent').then((m) => m.PlaygroundContent),
  { ssr: false },
)

export const Playground = (props: UsePlayGroundProps) => {
  const playground = usePlayground(props)
  const _state = playground.diffState ?? playground.state

  const config = useConfig(_state.config)
  if (!config.config && !config.error) return null

  return <PlaygroundContent playground={playground} config={config} />
}
