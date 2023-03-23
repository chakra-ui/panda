import type { PropsWithChildren, ReactNode } from 'react'
import { panda, Stack } from '../../../design-system/jsx'
import type { JsxStyleProps } from '../../../design-system/types'

export const Section = ({
  title,
  subTitle,
  children,
  ...props
}: PropsWithChildren<{ title: ReactNode; subTitle?: ReactNode } & JsxStyleProps>) => {
  return (
    <Stack p="4" gap="4" w="100%">
      {title && (
        <panda.div w="full" display="flex">
          <panda.h3>{title}</panda.h3>
          {subTitle}
        </panda.div>
      )}
      <panda.div p="4" w="100%" rounded="md" {...props}>
        {children}
      </panda.div>
    </Stack>
  )
}
