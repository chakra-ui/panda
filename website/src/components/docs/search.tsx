import { css, cx } from '@/styled-system/css'
import { useEffect, useState } from 'react'
import { SearchIcon } from '@/icons'
import { center } from '@/styled-system/patterns'

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

export const SearchButton = (props: React.ComponentProps<'button'>) => {
  const { className, ...rest } = props
  const key = useCommandOrControl()
  return (
    <>
      <div className={cx(styles.container, css({ hideBelow: 'sm' }))}>
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

const useCommandOrControl = () => {
  const [key, setKey] = useState<string | null>(null)
  useEffect(() => {
    setKey(navigator.userAgent.includes('Macintosh') ? '⌘K' : '⌃K')
  }, [])
  return key
}
