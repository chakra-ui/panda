import { Fragment, InputHTMLAttributes, useState } from 'react'
type FontTokensProps = {
  text?: string
  largeText?: boolean
  token: string
  fontTokens: Map<string, any>
}

export function FontTokens(props: FontTokensProps) {
  const { text: textProp = 'Panda', largeText = false, token, fontTokens } = props
  const [text, setText] = useState(textProp)

  const inputProps: InputHTMLAttributes<any> = {
    value: text,
    onChange(event) {
      setText(event.currentTarget.value)
    },
    placeholder: 'Preview Text',
    className: 'font-token-input',
  }

  const values = Array.from(fontTokens.values())

  return (
    <div className={`token-group font-tokens ${token}-token`}>
      <div className="font-token-input-wrapper">
        {largeText ? <textarea rows={5} {...inputProps} /> : <input {...inputProps} />}
      </div>
      <div className="token-content">
        <hr />
        {values.map((fontToken) => (
          <Fragment key={fontToken.extensions.prop}>
            <div className="font-wrapper">
              <div>
                <span className="label">{fontToken.extensions.prop} </span>
                <span>({fontToken.value})</span>
              </div>
              <span className="render" style={{ [token]: fontToken.value }}>
                {text}
              </span>
            </div>
            <hr />
          </Fragment>
        ))}
      </div>
    </div>
  )
}
