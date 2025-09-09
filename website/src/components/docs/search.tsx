import { Kbd } from '@/mdx/kbd'
import { css, cx } from '@/styled-system/css'
import { useEffect, useState } from 'react'

const styles = {
  container: css({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    color: 'fg',
    minW: '200px'
  }),

  input: css({
    flex: '1',
    appearance: 'none',
    textAlign: 'start',
    color: 'fg.muted',
    rounded: 'lg',
    px: 3,
    py: 2,
    transition: 'shadow',
    textStyle: { base: 'md', md: 'sm' },
    lineHeight: 'tight',
    bg: 'bg.muted'
  })
}

export const SearchButton = (props: React.ComponentProps<'button'>) => {
  const { className, ...rest } = props
  const key = useCommandOrControl()
  return (
    <div className={styles.container}>
      <button
        spellCheck={false}
        className={cx(className, styles.input)}
        {...rest}
      >
        Search docs...
      </button>
      <Kbd mounted={!!key}>{key}</Kbd>
    </div>
  )
}

const useCommandOrControl = () => {
  const [key, setKey] = useState<string | null>(null)
  useEffect(() => {
    setKey(navigator.userAgent.includes('Macintosh') ? '⌘K' : '⌃K')
  }, [])
  return key
}
