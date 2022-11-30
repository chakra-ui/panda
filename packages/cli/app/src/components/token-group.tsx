import { panda } from 'design-system/jsx'
import React from 'react'

export function TokenGroup(props: React.ReactNode) {
  return <panda.div display="flex" flexDir="column" gap="3" width="full" marginTop="5" {...props} />
}
