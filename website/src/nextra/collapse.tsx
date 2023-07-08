import { css, cx } from '@/styled-system/css'
import { useEffect, useRef } from 'react'

type Props = {
  children: React.ReactNode
  className?: string
  isOpen: boolean
  horizontal?: boolean
}

export const Collapse = (props: Props) => {
  const { children, className, isOpen, horizontal = false } = props

  const containerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef(0)
  const initialOpen = useRef(isOpen)
  const initialRender = useRef(true)

  useEffect(() => {
    const container = containerRef.current
    const inner = innerRef.current
    const animation = animationRef.current
    if (animation) {
      clearTimeout(animation)
    }
    if (initialRender.current || !container || !inner) return

    container.classList.toggle(css({ transitionDuration: '200ms' }), !isOpen)
    container.classList.toggle(css({ transitionDuration: '300ms' }), isOpen)

    if (horizontal) {
      // save initial width to avoid word wrapping when container width will be changed
      inner.style.width = `${inner.clientWidth}px`
      container.style.width = `${inner.clientWidth}px`
    } else {
      container.style.height = `${inner.clientHeight}px`
    }

    if (isOpen) {
      animationRef.current = window.setTimeout(() => {
        // should be style property in kebab-case, not css class name
        container.style.removeProperty('height')
      }, 300)
    } else {
      setTimeout(() => {
        if (horizontal) {
          container.style.width = '0px'
        } else {
          container.style.height = '0px'
        }
      }, 0)
    }
  }, [horizontal, isOpen])

  useEffect(() => {
    initialRender.current = false
  }, [])

  return (
    <div
      ref={containerRef}
      className={css({
        transform: 'translateZ(0)',
        overflow: 'hidden',
        transition: 'all',
        _motionReduce: {
          transition: 'none'
        }
      })}
      style={initialOpen.current || horizontal ? undefined : { height: 0 }}
    >
      <div
        ref={innerRef}
        data-open={isOpen}
        className={cx(
          css({
            transition: 'opacity 500ms ease-in-out',
            _motionReduce: {
              transition: 'none'
            },
            '&[data-open="false"]': {
              opacity: 0
            },
            '&[data-open="true"]': {
              opacity: 1
            }
          }),
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}
