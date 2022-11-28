import { Fragment, InputHTMLAttributes, useState } from 'react'
import { panda } from 'design-system/jsx'
import { css } from 'design-system/css'

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
    className: css({
      width: 'full',
      resize: 'vertical',
      padding: '4px',
    }),
  }

  const values = Array.from(fontTokens.values())

  return (
    <div
      className={css({
        layerStyle: 'token-group',
        ...cssProp,
      })}
    >
      <panda.div
        marginBottom="14px"
        position="sticky"
        top="0"
        boxShadow="0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
        background="var(--bg)"
      >
        {largeText ? <panda.textarea rows={5} {...inputProps} /> : <panda.input {...inputProps} />}
      </panda.div>
      <panda.div layerStyle="token-content">
        <hr />
        {values.map((fontToken) => (
          <Fragment key={fontToken.extensions.prop}>
            <panda.div display="flex" flexDir="column" gap="14px" className="font-wrapper">
              <div>
                <panda.span textTransform="capitalize" opacity="0.4" className="label">
                  {fontToken.extensions.prop}
                </panda.span>
                <span>({fontToken.value})</span>
              </div>
              <panda.span fontSize="2em" lineHeight="1em" className="render" style={{ [token]: fontToken.value }}>
                {text}
              </panda.span>
            </panda.div>
            <hr />
          </Fragment>
        ))}
      </panda.div>
    </div>
  )
}
