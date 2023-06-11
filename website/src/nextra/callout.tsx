import { css } from '@/styled-system/css'
import { callout as calloutRecipe } from '@/styled-system/recipes'
import { InformationCircleIcon } from 'nextra/icons'

const TypeToEmoji = {
  default: '💡',
  error: '🚫',
  info: <InformationCircleIcon className={css({ mt: 1 })} />,
  warning: '⚠️'
}

type CalloutType = keyof typeof TypeToEmoji

type Props = {
  type?: CalloutType
  emoji?: React.ReactNode
  children: React.ReactNode
}

export const Callout = (props: Props) => {
  const { children, type = 'default', emoji = TypeToEmoji[type] } = props
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
