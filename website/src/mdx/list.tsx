import { css, cva } from '@/styled-system/css'

const listStyles = cva({
  base: {
    mt: { base: '6', _first: '0' },
    ms: '6'
  },
  variants: {
    type: {
      ol: {
        listStyleType: 'decimal'
      },
      ul: {
        listStyleType: 'disc'
      }
    }
  }
})

export function UnorderedList(props: React.ComponentProps<'ul'>) {
  return <ul className={listStyles({ type: 'ul' })} {...props} />
}

export function OrderedList(props: React.ComponentProps<'ol'>) {
  return <ol className={listStyles({ type: 'ol' })} {...props} />
}

export function ListItem(props: React.ComponentProps<'li'>) {
  return <li className={css({ my: '2' })} {...props} />
}
