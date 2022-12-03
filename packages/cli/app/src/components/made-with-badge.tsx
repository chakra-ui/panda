import { panda } from '../../design-system/jsx'

export function MadeWithBadge() {
  return (
    <panda.div
      position="fixed"
      right="8"
      fontSize="sm"
      bottom="calc(env(safe-area-inset-bottom) + 1rem)"
      background="black"
      borderRadius="md"
      paddingX="2.5"
      paddingY="1"
      pointerEvents="none"
      color="white"
    >
      🐼 Made with Panda
    </panda.div>
  )
}
