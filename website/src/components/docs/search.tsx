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
    transition: 'shadow',
    textStyle: 'sm',
    lineHeight: 'tight',
    bg: 'bg.muted'
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
    alignItems: 'center',
    opacity: 0,
    '&[data-mounted]': {
      opacity: 1
    }
  })
}

interface SearchButtonProps extends React.ComponentProps<'button'> {
  /** Applied to the outer container div, not the button itself, use this to control overall width/flex from a parent that needs the search bar to grow. */
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

/**
 * Which modifier `mod` resolves to is only knowable on the client, so the badge
 * fades in once. It is absolutely positioned, so nothing reflows when it lands.
 */
const useHotkeyLabel = () => {
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    setLabel(formatHotkey(SEARCH_HOTKEY, { platform: 'auto', style: 'symbols' }))
  }, [])

  return label
}
