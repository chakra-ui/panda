import { panda } from '../../styled-system/jsx'
import { ColorWrapper } from './color-wrapper'

// remove initial underscore
const cleanCondition = (condition: string) => condition.replace(/^_/, '')

export function SemanticColorDisplay(props: { value: string; condition: string }) {
  const { value, condition } = props
  return (
    <ColorWrapper height="12" style={{ background: value }}>
      <panda.span
        fontWeight="medium"
        fontSize="sm"
        minW="5"
        bg="neutral.800"
        px="1"
        py="1"
        color="white"
        roundedBottomRight="sm"
        borderWidth="1px"
        borderColor="neutral.700"
      >
        {cleanCondition(condition)}
      </panda.span>
    </ColorWrapper>
  )
}
