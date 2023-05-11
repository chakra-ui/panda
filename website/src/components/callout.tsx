import type { ReactElement, ReactNode } from 'react'
import { InformationCircleIcon } from 'nextra/icons'
import { css } from '../../styled-system/css'
import { callout as calloutRecipe } from '../../styled-system/recipes'

const TypeToEmoji = {
  default: '💡',
  error: '🚫',
  info: <InformationCircleIcon className={css({ mt: 1 })} />,
  warning: '⚠️'
}

type CalloutType = keyof typeof TypeToEmoji

type CalloutProps = {
  type?: CalloutType
  emoji?: string | ReactElement
  children: ReactNode
}

export function Callout({
  children,
  type = 'default',
  emoji = TypeToEmoji[type]
}: CalloutProps): ReactElement {
  return (
    <div
      data-scope="callout"
      data-part="root"
      className={calloutRecipe({ type })}
    >
      <div data-scope="callout" data-part="icon">
        {emoji}
      </div>
      <div data-scope="callout" data-part="content">
        {children}
      </div>
    </div>
  )
}
