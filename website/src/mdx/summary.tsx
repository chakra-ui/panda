import { css } from '@/styled-system/css'
import { useDetails } from '../contexts'

const styles = css({
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  listStyle: 'none',
  p: 1,
  transitionProperty: 'colors',
  _hover: {
    bg: 'gray.100',
    _dark: { bg: 'neutral.800' }
  },
  _before: {
    mr: 1,
    display: 'inline-block',
    transitionProperty: 'transform',
    content: "''",
    _dark: { filter: 'invert(1)' }
  },
  '[data-expanded] > &': {
    _before: {
      transform: 'rotate(90deg)'
    }
  }
})

export const Summary = (props: React.ComponentProps<'summary'>) => {
  const setOpen = useDetails()
  return (
    <summary
      className={styles}
      {...props}
      onClick={e => {
        e.preventDefault()
        setOpen(v => !v)
      }}
    />
  )
}
