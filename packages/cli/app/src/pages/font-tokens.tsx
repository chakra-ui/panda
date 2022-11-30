import { Fragment, InputHTMLAttributes, useState } from 'react'
import { panda, Stack } from 'design-system/jsx'
import { TokenGroup } from '../components/token-group'
import { TokenContent } from '../components/token-content'

type FontTokensProps = {
  text?: string
  largeText?: boolean
  token: string
  fontTokens: Map<string, any>
  css?: any
}

export function FontTokens(props: FontTokensProps) {
  const { text: textProp = 'Panda', largeText = false, token, fontTokens, css: cssProp } = props
  const [text, setText] = useState(textProp)

  const inputProps: InputHTMLAttributes<any> = {
    value: text,
    onChange(event) {
      setText(event.currentTarget.value)
    },
    placeholder: 'Preview Text',
    css: {
      width: 'full',
      resize: 'vertical',
      padding: '1',
    },
  }

  const values = Array.from(fontTokens.values())

  return (
    <TokenGroup
      css={{
        ...cssProp,
      }}
    >
      <panda.div marginBottom="3.5" position="sticky" top="0" boxShadow="lg" background="bg">
        {largeText ? <panda.textarea rows={5} {...inputProps} /> : <panda.input {...inputProps} />}
      </panda.div>
      <TokenContent>
        <hr />
        {values.map((fontToken) => (
          <Fragment key={fontToken.extensions.prop}>
            <Stack gap="3.5">
              <div>
                <panda.span textTransform="capitalize" opacity="0.4" className="label" marginRight="1">
                  {fontToken.extensions.prop}
                </panda.span>
                <span>({fontToken.value})</span>
              </div>
              <panda.span fontSize="4xl" lineHeight="normal" className="render" style={{ [token]: fontToken.value }}>
                {text}
              </panda.span>
            </Stack>
            <hr />
          </Fragment>
        ))}
      </TokenContent>
    </TokenGroup>
  )
}
