import { VSCodeTextField, VSCodeTextArea } from '@vscode/webview-ui-toolkit/react'
import { Fragment, useState } from 'react'
type FontTokensProps = {
  text?: string
  largeText?: boolean
  token: string
  fontTokens: any
}

type ExtractProps<TComponentOrTProps> = TComponentOrTProps extends React.ComponentType<infer TProps>
  ? TProps
  : TComponentOrTProps

export function FontTokens(props: FontTokensProps) {
  const { text: textProp = 'Panda', largeText = false, token, fontTokens } = props
  const [text, setText] = useState(textProp)

  const inputProps: ExtractProps<typeof VSCodeTextField> & ExtractProps<typeof VSCodeTextArea> = {
    value: text,
    onInput(e) {
      const event = e as React.FormEvent<HTMLInputElement>
      setText(event.currentTarget.value)
    },
    placeholder: 'Preview Text',
    className: 'font-token-input',
  }

  return (
    <div className={`token-group font-tokens ${token}-token`}>
      <div className="font-token-input-wrapper">
        {largeText ? (
          <VSCodeTextArea rows={5} resize="vertical" {...inputProps} />
        ) : (
          <VSCodeTextField {...inputProps} />
        )}
      </div>
      <div className="token-content">
        <hr />
        {Object.entries(fontTokens).map(([weight, value]) => (
          <Fragment key={weight}>
            <div className="font-wrapper">
              <div>
                <span className="label">{weight}</span> <span> ({value})</span>
              </div>
              <span className="render" style={{ [token]: value }}>
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
