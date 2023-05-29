import type { ReactElement, ReactNode } from 'react'
import { useRef, useEffect } from 'react'
import { css, cx } from '../../styled-system/css'

export function Collapse({
  children,
  className,
  isOpen,
  horizontal = false
}: {
  children: ReactNode
  className?: string
  isOpen: boolean
  horizontal?: boolean
}): ReactElement {
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
        transitionProperty: 'all',
        transition: 'ease-in-out',
        _motionReduce: { transitionProperty: 'none' }
      })}
      style={initialOpen.current || horizontal ? undefined : { height: 0 }}
    >
      <div
        ref={innerRef}
        className={cx(
          css({
            transitionProperty: 'opacity',
            transitionDuration: '500ms',
            transition: 'ease-in-out',
            _motionReduce: { transitionProperty: 'none' },
            opacity: isOpen ? 1 : 0
          }),
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}
