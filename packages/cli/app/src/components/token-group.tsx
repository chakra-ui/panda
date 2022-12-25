import { panda } from '../../design-system/jsx'
import type { PropsWithChildren } from 'react'
import type { JsxStyleProps } from '../../design-system/types'

export function TokenGroup(props: PropsWithChildren<JsxStyleProps>) {
  return <panda.div display="flex" flexDir="column" gap="3" width="full" marginTop="5" {...props} />
}
