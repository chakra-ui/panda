import type { ReactNode, ReactElement, ComponentProps } from 'react'
import { useEffect, useRef, useState, cloneElement, Children } from 'react'
import type { Components } from 'nextra/mdx'
import { useSetActiveAnchor, DetailsProvider, useDetails } from './contexts'
import { Collapse, Anchor } from './components'
import type { DocsThemeConfig } from './constants'
import cn from 'clsx'
import { Code, Pre, Table, Td, Th, Tr } from 'nextra/components'
import { useIntersectionObserver, useSlugs } from './contexts/active-anchor'
import type { AnchorProps } from './components/anchor'
import { css } from '../styled-system/css'

// Anchor links
function HeadingLink({
  tag: Tag,
  context,
  children,
  id,
  ...props
}: ComponentProps<'h2'> & {
  tag: `h${2 | 3 | 4 | 5 | 6}`
  context: { index: number }
}): ReactElement {
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
    <Tag
      className={cn(
        css({
          fontWeight: 'semibold',
          letterSpacing: 'tight',
          color: 'slate.900',
          _dark: { color: 'slate.100' }
        }),
        {
          h2: css({
            mt: 10,
            borderBottom: '1px solid',
            pb: 1,
            fontSize: '3xl',
            borderColor: 'neutral.200/70',
            _moreContrast: {
              borderColor: 'neutral.400',
              _dark: { borderColor: 'primary.400' }
            },
            _dark: { borderColor: 'primary.100/10' }
          }),
          h3: css({ mt: 8, fontSize: '2xl' }),
          h4: css({ mt: 8, fontSize: 'xl' }),
          h5: css({ mt: 8, fontSize: 'lg' }),
          h6: css({ mt: 8, fontSize: 'base' })
        }[Tag]
      )}
      {...props}
    >
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

const findSummary = (children: ReactNode) => {
  let summary: ReactNode = null
  const restChildren: ReactNode[] = []

  Children.forEach(children, (child, index) => {
    if (child && (child as ReactElement).type === Summary) {
      summary ||= child
      return
    }

    let c = child
    if (
      !summary &&
      child &&
      typeof child === 'object' &&
      (child as ReactElement).type !== Details &&
      'props' in child &&
      child.props
    ) {
      const result = findSummary(child.props.children)
      summary = result[0]
      c = cloneElement(child, {
        ...child.props,
        children: result[1]?.length ? result[1] : undefined,
        key: index
      })
    }
    restChildren.push(c)
  })

  return [summary, restChildren]
}

const Details = ({
  children,
  open,
  ...props
}: ComponentProps<'details'>): ReactElement => {
  const [openState, setOpen] = useState(!!open)
  const [summary, restChildren] = findSummary(children)

  // To animate the close animation we have to delay the DOM node state here.
  const [delayedOpenState, setDelayedOpenState] = useState(openState)
  useEffect(() => {
    if (openState) {
      setDelayedOpenState(true)
    } else {
      const timeout = setTimeout(() => setDelayedOpenState(openState), 500)
      return () => clearTimeout(timeout)
    }
  }, [openState])

  return (
    <details
      className={css({
        my: 4,
        rounded: 'md',
        border: '1px solid',
        borderColor: 'gray.200',
        bg: 'white',
        p: 2,
        shadow: 'sm',
        _first: { mt: 0 },
        _dark: {
          borderColor: 'neutral.800',
          bg: 'neutral.900'
        }
      })}
      {...props}
      open={delayedOpenState}
      {...(openState && { 'data-expanded': true })}
    >
      <DetailsProvider value={setOpen}>{summary}</DetailsProvider>
      <Collapse isOpen={openState}>{restChildren}</Collapse>
    </details>
  )
}

const Summary = (props: ComponentProps<'summary'>): ReactElement => {
  const setOpen = useDetails()
  return (
    <summary
      className={cn(
        css({
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
          _rtl: {
            _before: { transform: 'rotate(180deg)' }
          },
          '[data-expanded] > &': {
            _before: {
              transform: 'rotate(90deg)'
            }
          }
        })
      )}
      {...props}
      onClick={e => {
        e.preventDefault()
        setOpen(v => !v)
      }}
    />
  )
}

const EXTERNAL_HREF_REGEX = /https?:\/\//

export const Link = ({ href = '', className, ...props }: AnchorProps) => (
  <Anchor
    href={href}
    newWindow={EXTERNAL_HREF_REGEX.test(href)}
    className={cn(
      css({
        color: 'primary.600',
        textDecorationLine: 'underline',
        textDecorationThickness: 'from-font',
        textUnderlinePosition: 'from-font'
      }),
      className
    )}
    {...props}
  />
)

const A = ({ href = '', ...props }) => (
  <Anchor href={href} newWindow={EXTERNAL_HREF_REGEX.test(href)} {...props} />
)

export const getComponents = ({
  isRawLayout,
  components
}: {
  isRawLayout?: boolean
  components?: DocsThemeConfig['components']
}): Components => {
  if (isRawLayout) {
    return { a: A }
  }

  const context = { index: 0 }
  return {
    h1: props => (
      <h1
        className={css({
          mt: 2,
          fontSize: '4xl',
          fontWeight: 'bold',
          lineHeight: 'tight',
          color: 'slate.900',
          _dark: { color: 'slate.100' }
        })}
        {...props}
      />
    ),
    h2: props => <HeadingLink tag="h2" context={context} {...props} />,
    h3: props => <HeadingLink tag="h3" context={context} {...props} />,
    h4: props => <HeadingLink tag="h4" context={context} {...props} />,
    h5: props => <HeadingLink tag="h5" context={context} {...props} />,
    h6: props => <HeadingLink tag="h6" context={context} {...props} />,
    ul: props => (
      <ul
        className={css({
          mt: 6,
          listStyleType: 'disc',
          _first: { mt: 0 },
          _ltr: { ml: 6 },
          _rtl: { mr: 6 }
        })}
        {...props}
      />
    ),
    ol: props => (
      <ol
        className={css({
          mt: 6,
          listStyleType: 'decimal',
          _first: { mt: 0 },
          _ltr: { ml: 6 },
          _rtl: { mr: 6 }
        })}
        {...props}
      />
    ),
    li: props => <li className={css({ my: 2 })} {...props} />,
    blockquote: props => (
      <blockquote
        className={cn(
          css({
            mt: 6,
            borderColor: 'gray.300',
            fontStyle: 'italic',
            color: 'gray.700',
            _dark: { borderColor: 'gray.700', color: 'gray.400' },
            _first: { mt: 0 },
            _ltr: { borderLeftWidth: '2', pl: 6 },
            _rtl: { borderRightWidth: '2', pr: 6 }
          })
        )}
        {...props}
      />
    ),
    hr: props => (
      <hr
        className={css({ my: 8, _dark: { borderColor: 'gray.900' } })}
        {...props}
      />
    ),
    a: Link,
    table: props => (
      <Table
        className={cn(
          'nextra-scrollbar',
          css({ mt: 6, p: 0, _first: { mt: 0 } })
        )}
        {...props}
      />
    ),
    p: props => (
      <p
        className={css({ mt: 6, lineHeight: '1.75rem', _first: { mt: 0 } })}
        {...props}
      />
    ),
    tr: Tr,
    th: Th,
    td: Td,
    details: Details,
    summary: Summary,
    pre: Pre,
    code: Code,
    ...components
  }
}
