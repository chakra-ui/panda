import { SearchIcon } from '@/icons'
import { css, cx } from '@/styled-system/css'
import { center } from '@/styled-system/patterns'
import { formatHotkey } from '@zag-js/hotkeys'
import { useEffect, useState } from 'react'

/** Kept in step with the `mod+k` command registered by the command menu. */
export const SEARCH_HOTKEY = 'mod+k'

const styles = {
  container: css({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    color: 'fg',
    minW: { sm: '200px' }
  }),

  input: css({
    flex: '1',
    appearance: 'none',
    textAlign: 'start',
    color: 'fg.muted',
    rounded: 'lg',
    py: '2',
    ps: '3',
    pe: '12',
    cursor: 'pointer',
    transitionProperty: 'background-color',
    transitionDuration: '150ms',
    textStyle: 'sm',
    lineHeight: 'tight',
    bg: 'bg.muted',
    _hover: { bg: 'bg.muted.hover' }
  }),

  kbd: css({
    transition: 'opacity',
    position: 'absolute',
    my: '1.5',
    userSelect: 'none',
    insetEnd: '1.5',
    height: '5',
    rounded: 'sm',
    bg: { base: 'white', _dark: 'rgb(17 17 17 / 0.2)' },
    color: 'gray.500',
    px: '1.5',
    fontFamily: 'mono',
    fontSize: '10px',
    fontWeight: 'medium',
    borderWidth: '1px',
    // `align-items` needs a flex container; as a block the glyphs sat 2px high.
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    '&[data-mounted]': {
      opacity: 1
    }
  })
}

interface SearchButtonProps extends React.ComponentProps<'button'> {
  /** Applied to the container, not the button, so a parent can size the bar. */
  containerClassName?: string
}

export const SearchButton = (props: SearchButtonProps) => {
  const { className, containerClassName, ...rest } = props
  const key = useHotkeyLabel()
  return (
    <>
      <div className={cx(styles.container, css({ hideBelow: 'sm' }), containerClassName)}>
        <button
          spellCheck={false}
          className={cx(className, styles.input)}
          {...rest}
        >
          Search docs...
        </button>
        <kbd data-mounted={!!key || undefined} className={styles.kbd}>
          {key}
        </kbd>
      </div>
      <button
        {...rest}
        className={center({
          boxSize: '7',
          hideFrom: 'sm',
          _icon: { boxSize: '5' }
        })}
      >
        <SearchIcon />
      </button>
    </>
  )
}

/** The modifier is only knowable on the client, so the badge fades in once. */
const useHotkeyLabel = () => {
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    setLabel(formatHotkey(SEARCH_HOTKEY, { platform: 'auto', style: 'symbols' }))
  }, [])

  return label
}
