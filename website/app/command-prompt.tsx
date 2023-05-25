import { HStack, panda } from '../styled-system/jsx'

export const CommandPrompt = (props: { value: string }) => {
  const { value } = props
  return (
    <HStack
      textStyle="xl"
      letterSpacing="tight"
      fontWeight="medium"
      fontFamily="mono"
    >
      <panda.code opacity="0.3">$</panda.code>
      <span>{value}</span>
    </HStack>
  )
}
