import type { Token } from '@pandacss/token-dictionary'
import * as React from 'react'
import { HStack, panda, Stack } from '../../styled-system/jsx'
import { TokenContent } from '../components/token-content'
import { TokenGroup } from '../components/token-group'
import { Input, Textarea } from './input'
import { StickyTop } from './sticky-top'

interface FontTokensProps {
  text?: string
  largeText?: boolean
  token: string
  fontTokens: Token[]
  css?: any
}

export default function FontTokens(props: FontTokensProps) {
  const { text: textProp = 'Hello World', largeText = false, token, fontTokens } = props

  const [text, setText] = React.useState(textProp)

  const handleChange = (event: React.ChangeEvent<any>) => {
    setText(event.target.value)
  }

  return (
    <TokenGroup>
      <StickyTop>
        {largeText ? (
          <Textarea resize="vertical" onChange={handleChange} rows={5} value={text} placeholder="Preview Text" />
        ) : (
          <Input value={text} onChange={handleChange} placeholder="Preview Text" />
        )}
      </StickyTop>

      <TokenContent>
        {fontTokens.map((fontToken) => (
          <React.Fragment key={fontToken.extensions.prop}>
            <Stack gap="3.5">
              <HStack gap="1">
                <panda.span fontWeight="medium">{fontToken.extensions.prop}</panda.span>
                <panda.span opacity="0.4">({fontToken.value})</panda.span>
              </HStack>
              <panda.span
                fontSize="4xl"
                lineHeight="normal"
                className="render"
                style={{
                  [token]: fontToken.value,
                }}
              >
                {text}
              </panda.span>
            </Stack>
          </React.Fragment>
        ))}
      </TokenContent>
    </TokenGroup>
  )
}
