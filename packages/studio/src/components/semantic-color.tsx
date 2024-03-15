import * as React from 'react'
import { Flex, panda } from '../../styled-system/jsx'
import { ColorWrapper } from './color-wrapper'
import * as context from '../lib/panda-context'

const getSemanticColorValue = (variable: string): string => {
  const _name = variable?.match(/var\(\s*--(.*?)\s*\)/)
  if (!_name) return variable

  const name = _name[1].replaceAll('-', '.')
  const token = context.tokens.getByName(name)

  if (!token) {
    const defaultToken = context.tokens.getByName(`${name}.default`)
    return getSemanticColorValue(defaultToken?.value)
  }

  if (token.value.startsWith('var(--')) return getSemanticColorValue(token.value)
  return token.value
}

// remove initial underscore
const cleanCondition = (condition: string) => condition.replace(/^_/, '')

export function SemanticColorDisplay(props: { value: string; condition: string; token?: string }) {
  const { value, condition } = props

  const tokenValue = getSemanticColorValue(value)

  return (
    <Flex direction="column" w="full">
      <ColorWrapper height="12" style={{ background: tokenValue }}>
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
      <panda.div opacity="0.7" fontSize="sm">
        {value} {value !== tokenValue && `- ${tokenValue}`}
      </panda.div>
    </Flex>
  )
}
