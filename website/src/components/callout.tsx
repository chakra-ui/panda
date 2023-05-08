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
        borderColor: 'rgb(from token(colors.orange.400) / 30%)',
        backgroundColor: 'rgb(from token(colors.orange.400) / 20%)', // TODO ?
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
        borderColor: 'rgb(from token(colors.red.200) / 30%)',
        backgroundColor: 'rgb(from token(colors.red.900) / 30%)',
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
        borderColor: 'rgb(from token(colors.blue.200) / 30%)',
        backgroundColor: 'rgb(from token(colors.blue.900) / 30%)',
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
        borderColor: 'rgb(from token(colors.yellow.200) / 30%)',
        backgroundColor: 'rgb(from token(colors.yellow.700) / 30%)',
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
            _dark: { borderColor: 'currentColor' } // TODO currentColor vs current vs currentcolor
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
