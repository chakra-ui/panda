import * as React from 'react'
import { panda, Stack } from '../../styled-system/jsx'

interface EmptyStateProps {
  title: string
  children: React.ReactNode
  icon: React.ReactElement
}

export function EmptyState(props: EmptyStateProps) {
  const { title, children, icon } = props
  return (
    <Stack align="center" gap="5" justify="center" height="full" minHeight="40vh">
      <panda.span fontSize="5xl">{icon}</panda.span>
      <Stack opacity="0.8" align="center">
        <panda.span fontWeight="semibold">{title}</panda.span>
        <div>{children}</div>
      </Stack>
    </Stack>
  )
}
