import { css, cva } from '@/styled-system/css'
import { useEffect, useRef } from 'react'
import { useSetActiveAnchor } from '../nextra/contexts'
import {
  useIntersectionObserver,
  useSlugs
} from '../nextra/contexts/active-anchor'

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
    color: { base: 'slate.900', _dark: 'slate.100' }
  },
  variants: {
    tag: {
      h1: { mt: 2, fontSize: '4xl', fontWeight: 'bold' },
      h2: { mt: '10', fontSize: '3xl' },
      h3: { mt: '8', fontSize: '2xl' },
      h4: { mt: '8', fontSize: 'xl' },
      h5: { mt: '8', fontSize: 'lg' },
      h6: { mt: '8', fontSize: 'base' }
    }
  }
})

export const Heading = (props: Props) => {
  const { tag: Tag, context, children, id, ...rest } = props

  const setActiveAnchor = useSetActiveAnchor()
  const slugs = useSlugs()
  const observer = useIntersectionObserver()
  const obRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    if (!id) return
    const heading = obRef.current
    if (!heading) return
    slugs.set(heading, [id, (context.index += 1)])
    observer?.observe(heading)

    return () => {
      observer?.disconnect()
      slugs.delete(heading)
      setActiveAnchor(f => {
        const ret = { ...f }
        delete ret[id]
        return ret
      })
    }
  }, [id, context, slugs, observer, setActiveAnchor])

  return (
    <Tag className={styles({ tag: Tag })} {...rest}>
      {children}
      <span
        className={css({ position: 'absolute', mt: -20 })}
        id={id}
        ref={obRef}
      />
      <a
        href={`#${id}`}
        className="subheading-anchor"
        aria-label="Permalink for this section"
      />
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
