import { cva } from '@/styled-system/css'

type HeadingTag = `h${1 | 2 | 3 | 4 | 5 | 6}`

type HeadingContext = { index: number }

type Props = React.ComponentProps<'h2'> & {
  tag: HeadingTag
  context: HeadingContext
}

const styles = cva({
  base: {
    fontWeight: 'semibold',
    fontFamily: 'heading',
    letterSpacing: 'tight',
    color: {
      base: 'gray.900',
      _dark: 'gray.100'
    }
  },
  variants: {
    tag: {
      h1: { mt: '2', fontSize: { base: '3xl', md: '4xl' }, fontWeight: 'bold' },
      h2: {
        mt: '16',
        mb: '6',
        pb: '3',
        fontSize: { base: '2xl', md: '3xl' },
        borderBottomWidth: '1px',
        borderColor: 'border'
      },
      // h3/h4 step down with h2 so the hierarchy still reads on a phone.
      h3: { mt: '10', fontSize: { base: 'xl', md: '2xl' } },
      h4: { mt: '8', fontSize: { base: 'lg', md: 'xl' } },
      h5: { mt: '8', fontSize: 'lg' },
      h6: { mt: '8', fontSize: 'base' }
    }
  }
})

export const Heading = (props: Props) => {
  const { tag: Tag, context: _context, children, id, ...rest } = props

  return (
    <Tag className={styles({ tag: Tag })} id={id} {...rest}>
      {children}
    </Tag>
  )
}

export function createHeadings(
  context: HeadingContext
): Record<HeadingTag, React.FC<any>> {
  return {
    h1: props => <h1 className={styles({ tag: 'h1' })} {...props} />,
    h2: props => <Heading tag="h2" context={context} {...props} />,
    h3: props => <Heading tag="h3" context={context} {...props} />,
    h4: props => <Heading tag="h4" context={context} {...props} />,
    h5: props => <Heading tag="h5" context={context} {...props} />,
    h6: props => <Heading tag="h6" context={context} {...props} />
  }
}
