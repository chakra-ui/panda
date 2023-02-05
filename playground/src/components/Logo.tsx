import { HStack, Box, panda } from '@/design-system/jsx'

export const Logo = () => (
  <HStack gap="2">
    <Box w="8" h="8" bg="gray.300" borderRadius="full" />
    <panda.span>Panda</panda.span>
  </HStack>
)
