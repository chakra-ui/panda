import type { ReactElement, ReactNode } from 'react'
import cn from 'clsx'
import { InformationCircleIcon } from 'nextra/icons'
import { css } from '../../styled-system/css'

const TypeToEmoji = {
  default: '💡',
  error: '🚫',
  info: <InformationCircleIcon className={css({ mt: 1 })} />,
  warning: '⚠️'
}

type CalloutType = keyof typeof TypeToEmoji

const classes: Record<CalloutType, string> = {
  default: cn(
    css({
      borderColor: 'orange.100',
      backgroundColor: 'orange.50',
      color: 'orange.800',
      _dark: {
        borderColor: 'rgb(251 146 60 / 0.3)', // opacity modifier
        backgroundColor: 'rgb(251 146 60 / 0.2)',
        color: 'orange.300'
      }
    })
  ),
  error: cn(
    css({
      borderColor: 'red.100',
      backgroundColor: 'red.50',
      color: 'red.800',
      _dark: {
        borderColor: 'rgb(248 113 113 / 0.3)',
        backgroundColor: 'rgb(127 29 29 / 0.3)',
        color: 'red.200'
      }
    })
  ),
  info: cn(
    css({
      borderColor: 'blue.100',
      backgroundColor: 'blue.50',
      color: 'blue.800',
      _dark: {
        borderColor: 'rgb(191 219 254 / 0.3)',
        backgroundColor: 'rgb(30 58 138 / 0.3)',
        color: 'blue.200'
      }
    })
  ),
  warning: cn(
    css({
      borderColor: 'yellow.100',
      backgroundColor: 'yellow.50',
      color: 'yellow.800',
      _dark: {
        borderColor: 'rgb(254 240 138 / 0.3)',
        backgroundColor: 'rgb(113 63 18 / 0.3)',
        color: 'yellow.200'
      }
    })
  )
}

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
      className={cn(
        'nextra-callout',
        css({
          overflowX: 'auto',
          mt: 6,
          display: 'flex',
          borderRadius: 'lg',
          border: '1px solid',
          py: 2,
          _ltr: { pr: 4 },
          _rtl: { pl: 4 },
          _moreContrast: {
            color: 'currentColor',
            _dark: { borderColor: 'currentColor' }
          }
        }),
        classes[type]
      )}
    >
      <div
        className={css({
          userSelect: 'none',
          textStyle: 'xl',
          _ltr: { pl: 3, pr: 2 },
          _rtl: { pr: 3, pl: 2 }
        })}
        style={{
          fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"'
        }}
      >
        {emoji}
      </div>
      <div
        className={css({ width: '100%', minWidth: 0, lineHeight: '1.75rem' })}
      >
        {children}
      </div>
    </div>
  )
}
