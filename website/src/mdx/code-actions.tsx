import { css, cva } from '@/styled-system/css'
import { WordWrapIcon } from '../icons'
import { CopyToClipboard } from './copy-to-clipboard'

/* -----------------------------------------------------------------------------
 * Code actions
 * -----------------------------------------------------------------------------*/

type CodeActionsProps = {
  filename?: string
  onClickWrap: VoidFunction
  hasCopyCode?: boolean
  getClipboardValue: () => string
}

const styles = cva({
  base: {
    opacity: '0',
    transition: 'opacity 0.2s',
    'div:hover > &': { opacity: 1 },
    _focusWithin: { opacity: 1 },
    display: 'flex',
    gap: '1',
    position: 'absolute',
    m: '3',
    right: '0'
  },
  variants: {
    hasFilename: {
      true: { top: '2' },
      false: { top: '0' }
    }
  }
})

const buttonStyles = css({
  bg: 'yellow.300',
  color: 'neutral.800',
  rounded: 'md',
  p: '1.5',
  hideFrom: 'md'
})

export const CodeActions = (props: CodeActionsProps) => {
  const { filename, onClickWrap, hasCopyCode, getClipboardValue } = props
  return (
    <div className={styles({ hasFilename: Boolean(filename) })}>
      <button
        onClick={onClickWrap}
        className={buttonStyles}
        title="Toggle word wrap"
      >
        <WordWrapIcon
          className={css({ pointerEvents: 'none', h: '4', w: '4' })}
        />
      </button>
      {hasCopyCode && <CopyToClipboard getValue={getClipboardValue} />}
    </div>
  )
}
