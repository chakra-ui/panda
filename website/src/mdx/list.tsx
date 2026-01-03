import { css, cva } from '@/styled-system/css'

const listStyles = cva({
  base: {
    '--margin': 'spacing.6',
    mt: { base: 'var(--margin)', _first: '0' },
    ms: '6',
    // Remove or reduce mt for nested lists: target ul/ol within ul/ol
    '& ul, & ol': {
      '--margin': 'spacing.2'
    }
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
