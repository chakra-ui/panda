import { panda } from '../../design-system/jsx'
import type { PropsWithChildren } from 'react'
import type { JsxStyleProps } from '../../design-system/types'

export function TokenContent(props: PropsWithChildren<JsxStyleProps>) {
  return <panda.div display="flex" flexDir="column" gap="5" {...props} />
}
