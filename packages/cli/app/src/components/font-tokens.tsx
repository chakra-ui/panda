import { panda, Stack } from '../../design-system/jsx'
import { Fragment, useState } from 'react'
import { css } from '../../design-system/css'
import { TokenContent } from '../components/token-content'
import { TokenGroup } from '../components/token-group'

type FontTokensProps = {
  text?: string
  largeText?: boolean
  token: string
  fontTokens: Map<string, any>
  css?: any
}

const inputClassname = css({
  width: 'full',
  resize: 'vertical',
  padding: '1',
  background: 'card',
})

export function FontTokens(props: FontTokensProps) {
  const { text: textProp = 'Panda', largeText = false, token, fontTokens } = props
  const [text, setText] = useState(textProp)

  const values = Array.from(fontTokens.values())

  return (
    <TokenGroup>
      <panda.div marginBottom="3.5" position="sticky" top="0" boxShadow="lg">
        {largeText ? (
          <textarea
            className={inputClassname}
            onChange={(event) => {
              setText(event.currentTarget.value)
            }}
            rows={5}
            value={text}
            placeholder="Preview Text"
          />
        ) : (
          <input
            className={inputClassname}
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
              <div>
                <panda.span opacity="0.4" className="label" marginRight="1">
                  {fontToken.extensions.prop}
                </panda.span>
                <span>({fontToken.value})</span>
              </div>
              <panda.span fontSize="4xl" lineHeight="normal" className="render" style={{ [token]: fontToken.value }}>
                {text}
              </panda.span>
            </Stack>
          </Fragment>
        ))}
      </TokenContent>
    </TokenGroup>
  )
}
