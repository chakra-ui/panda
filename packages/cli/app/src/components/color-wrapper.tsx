import { panda } from '../../design-system/jsx'
import type { JsxStyleProps } from '../../design-system/types'
import type { PropsWithChildren } from 'react'

export function ColorWrapper(props: PropsWithChildren<JsxStyleProps>) {
  return (
    <panda.div
      width="full"
      height="20"
      borderRadius="sm"
      position="relative"
      overflow="hidden"
      _before={{
        content: "''",
        position: 'absolute',
        borderRadius: 'sm',
        width: '100%',
        height: '100%',
        backgroundSize: '3px',
        zIndex: '-1',
        background:
          'url(data:image/svg+xml;utf8,%3Csvg%20width%3D%226%22%20height%3D%226%22%20viewBox%3D%220%200%206%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M0%200H3V3H0V0Z%22%20fill%3D%22%23E1E1E1%22/%3E%3Cpath%20d%3D%22M3%200H6V3H3V0Z%22%20fill%3D%22white%22/%3E%3Cpath%20d%3D%22M3%203H6V6H3V3Z%22%20fill%3D%22%23E1E1E1%22/%3E%3Cpath%20d%3D%22M0%203H3V6H0V3Z%22%20fill%3D%22white%22/%3E%3C/svg%3E%0A)',
      }}
      {...props}
    />
  )
}
