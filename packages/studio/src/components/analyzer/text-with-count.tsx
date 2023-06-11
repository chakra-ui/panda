import type { PropsWithChildren } from 'react'
import { panda } from '../../../styled-system/jsx'
import type { JsxStyleProps } from '../../../styled-system/types'

export const TextWithCount = ({ children, count, ...props }: PropsWithChildren<{ count: number } & JsxStyleProps>) => {
  return (
    <panda.div display="inline-flex" alignItems="center" {...props}>
      <panda.span>{children}</panda.span>
      <Sup>({count})</Sup>
    </panda.div>
  )
}

const Sup = ({ children, className }: PropsWithChildren<{ className?: string }>) => {
  return (
    <panda.sup
      fontSize="75%"
      lineHeight={0}
      position="relative"
      top="-0.35em"
      opacity="0.5"
      ml="1"
      className={className}
    >
      {children}
    </panda.sup>
  )
}
