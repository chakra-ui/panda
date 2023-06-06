import type { ComponentProps, ReactElement } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { css } from '../../styled-system/css'
import { CheckIcon, CopyIcon } from '../icons'

const buttonStyles = css({
  bg: 'yellow.300',
  color: 'neutral.800',
  rounded: 'md',
  p: '1.5'
})

type Props = ComponentProps<'button'> & {
  getValue: () => string
}

export const CopyToClipboard = (props: Props): ReactElement => {
  const { getValue, ...rest } = props
  const [isCopied, setCopied] = useState(false)

  useEffect(() => {
    if (!isCopied) return
    const timerId = setTimeout(() => {
      setCopied(false)
    }, 2000)

    return () => {
      clearTimeout(timerId)
    }
  }, [isCopied])

  const handleClick = useCallback<
    NonNullable<ComponentProps<'button'>['onClick']>
  >(async () => {
    setCopied(true)
    if (!navigator?.clipboard) {
      console.error('Access to clipboard rejected!')
    }
    try {
      await navigator.clipboard.writeText(getValue())
    } catch {
      console.error('Failed to copy!')
    }
  }, [getValue])

  const Icon = isCopied ? CheckIcon : CopyIcon

  return (
    <button
      className={buttonStyles}
      onClick={handleClick}
      title="Copy code"
      tabIndex={0}
      {...rest}
    >
      <Icon
        className={css({ pointerEvents: 'none', height: '4', width: '4' })}
      />
    </button>
  )
}
