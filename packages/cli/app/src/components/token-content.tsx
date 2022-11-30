import { panda } from 'design-system/jsx'
import React from 'react'

export function TokenContent(props: React.ReactNode) {
  return <panda.div display="flex" flexDir="column" gap="5" {...props} />
}
