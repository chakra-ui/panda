import { Fragment, useState } from 'react'
import { HStack, panda, Stack } from '../../styled-system/jsx'
import { TokenContent } from '../components/token-content'
import { TokenGroup } from '../components/token-group'
import { Input, Textarea } from './input'

type FontTokensProps = {
  text?: string
  largeText?: boolean
  token: string
  fontTokens: Map<string, any>
  css?: any
}

export function FontTokens(props: FontTokensProps) {
  const { text: textProp = 'Hello World', largeText = false, token, fontTokens } = props
  const [text, setText] = useState(textProp)

  const values = Array.from(fontTokens.values())

  return (
    <TokenGroup>
      <panda.div mb="3.5" position="sticky" top="0" zIndex={1}>
        {largeText ? (
          <Textarea
            resize="vertical"
            onChange={(event) => {
              setText(event.currentTarget.value)
            }}
            rows={5}
            value={text}
            placeholder="Preview Text"
          />
        ) : (
          <Input
            value={text}
            onChange={(event) => {
              setText(event.currentTarget.value)
            }}
            placeholder="Preview Text"
          />
        )}
      </panda.div>

      <TokenContent>
        {values.map((fontToken) => (
          <Fragment key={fontToken.extensions.prop}>
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
          </Fragment>
        ))}
      </TokenContent>
    </TokenGroup>
  )
}
