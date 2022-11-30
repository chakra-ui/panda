import { panda } from 'design-system/jsx'
import type { PropsWithChildren } from 'react'

export function TokenGroup(props: PropsWithChildren) {
  return <panda.div display="flex" flexDir="column" gap="3" width="full" marginTop="5" {...props} />
}
