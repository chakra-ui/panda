import { Box, HStack } from '@/design-system/jsx'
import { PropsWithChildren } from 'react'

export const Toolbar = (props: PropsWithChildren) => (
  <Box px="6" height="16" borderBottomWidth="1px">
    <HStack justifyContent="space-between" alignItems="center" height="100%">
      <Box>Logo</Box>
      {props.children}
    </HStack>
  </Box>
)
