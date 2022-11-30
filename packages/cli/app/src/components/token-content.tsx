import { panda } from 'design-system/jsx'
import type { PropsWithChildren } from 'react'

export function TokenContent(props: PropsWithChildren) {
  return <panda.div display="flex" flexDir="column" gap="5" {...props} />
}
