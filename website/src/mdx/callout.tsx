import { css } from '@/styled-system/css'
import { callout as calloutRecipe } from '@/styled-system/recipes'
import { InformationCircleIcon } from '@/icons'

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
  const classes = calloutRecipe({ type })
  return (
    <div className={classes.root}>
      <div className={classes.icon}>{emoji}</div>
      <div className={classes.content}>{children}</div>
    </div>
  )
}
