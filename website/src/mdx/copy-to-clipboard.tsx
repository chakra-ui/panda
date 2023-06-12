import { css } from '@/styled-system/css'
import { CheckIcon, CopyIcon } from '../icons'
import { useClipboard } from './use-clipboard'

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
  const { isCopied, copy } = useClipboard({ getValue })

  const Icon = isCopied ? CheckIcon : CopyIcon

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
