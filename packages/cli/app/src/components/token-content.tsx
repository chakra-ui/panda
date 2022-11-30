import { panda } from 'design-system/jsx'
import type { PropsWithChildren } from 'react'

export function TokenContent(props: PropsWithChildren<JSXStyleProperties>) {
  return <panda.div display="flex" flexDir="column" gap="5" {...props} />
}
