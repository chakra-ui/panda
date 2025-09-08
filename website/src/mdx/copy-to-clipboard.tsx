'use client'

import { CheckIcon, CopyIcon } from '@/icons'
import { css } from '@/styled-system/css'
import { useClipboard } from '@ark-ui/react/clipboard'

const buttonStyles = css({
  bg: 'yellow.300',
  color: 'neutral.800',
  rounded: 'md',
  p: '1.5'
})

const iconStyles = css({
  pointerEvents: 'none',
  height: '4',
  width: '4'
})

type Props = React.ComponentProps<'button'> & {
  getValue(): string
}

export const CopyToClipboard = (props: Props) => {
  const { getValue, ...rest } = props
  const { copied, copy } = useClipboard({
    get value() {
      return getValue()
    }
  })

  const Icon = copied ? CheckIcon : CopyIcon

  return (
    <button
      className={buttonStyles}
      onClick={copy}
      title="Copy code"
      tabIndex={0}
      {...rest}
    >
      <Icon className={iconStyles} />
    </button>
  )
}
