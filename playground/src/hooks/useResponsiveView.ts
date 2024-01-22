import { EventHandler, useEffect, useLayoutEffect, useRef, useState } from 'react'

type PointerEvent = TouchEvent & MouseEvent
const getPointerPosition = (e: Event) => {
  const event = e as PointerEvent
  if (event.targetTouches) {
    if (event.targetTouches.length === 1) {
      return {
        x: event.targetTouches[0].clientX,
        y: event.targetTouches[0].clientY,
      }
    }
    return null
  }
  return { x: event.clientX, y: event.clientY }
}

export function useResponsiveView(_breakpoints: Record<string, string> = {}) {
  const ASPECT_RATIO = 4 / 5
  const breakpoints = Object.assign(
    { base: { width: 320, height: 670 } },
    Object.entries(_breakpoints).reduce((acc, nxt) => {
      const width = parseInt(nxt[1].replace('px', ''))
      return { ...acc, [nxt[0]]: { width, height: width / ASPECT_RATIO } }
    }, {} as Record<string, Record<'width' | 'height', number>>),
  )

  const [responsiveSize, setResponsiveSize] = useState(breakpoints[Object.keys(breakpoints)[0]])

  const activeBreakpoint = Object.entries(breakpoints).find(
    ([, breakpoint]) => responsiveSize.width <= breakpoint.width,
  )?.[0]

  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null)

  const [size, setSize] = useState<{ width: number; height: number; visible?: boolean }>({ width: 0, height: 0 })

  const [resizing, setResizing] = useState<{
    handle?: string
    startHeight?: number
    startWidth?: number
    startX?: number
    startY?: number
  }>()
  const timeout = useRef<number>()
  const constrainedResponsiveSize = constrainSize(responsiveSize.width, responsiveSize.height)

  function constrainWidth(desiredWidth: number) {
    const zoom = desiredWidth > size.width - 34 ? (size.width - 34) / desiredWidth : 1
    return {
      width: Math.min(Math.max(270, Math.round(desiredWidth * (1 / zoom))), Math.round((size.width - 34) * (1 / zoom))),
      zoom,
    }
  }

  function constrainHeight(desiredHeight: number) {
    const zoom = desiredHeight > size.height - 17 - 40 ? (size.height - 17 - 40) / desiredHeight : 1
    return {
      height: Math.min(
        Math.max(300, Math.round(desiredHeight * (1 / zoom))),
        Math.round((size.height - 17 - 40) * (1 / zoom)),
      ),
      zoom,
    }
  }

  function constrainSize(desiredWidth: number, desiredHeight: number) {
    const { width, zoom: widthZoom } = constrainWidth(desiredWidth)
    const { height, zoom: heightZoom } = constrainHeight(desiredHeight)
    return {
      width,
      height,
      zoom: Math.min(widthZoom, heightZoom),
    }
  }

  useEffect(() => {
    let isInitial = true
    const observer = new ResizeObserver(() => {
      window.clearTimeout(timeout.current)
      const rect = containerRef?.getBoundingClientRect()
      if (!rect) return
      const width = Math.round(rect.width)
      const height = Math.round(rect.height)
      setSize({
        visible: !isInitial && width !== 0 && height !== 0,
        width,
        height,
      })
      timeout.current = window.setTimeout(() => {
        setSize((size) => ({ ...size, visible: false }))
      }, 1000)
      isInitial = false
    })
    if (containerRef) observer.observe(containerRef)
    return () => {
      observer.disconnect()
    }
  }, [containerRef])

  useLayoutEffect(() => {
    if (size.width > 320 && size.height > 670) {
      setResponsiveSize(({ width, height }) => ({ width, height }))
    }

    function onMouseMove(e: Event) {
      e.preventDefault()
      const { x, y } = getPointerPosition(e) ?? { x: 0, y: 0 }

      if (!resizing) return
      if (resizing.handle === 'bottom') {
        document.body.classList.add('cursor_ns-resize')
        setResponsiveSize(({ width }) => ({
          width,
          height: (resizing.startHeight ?? 0) + (y - (resizing.startY ?? 0)),
        }))
      } else if (resizing.handle === 'top') {
        document.body.classList.add('cursor_ns-resize')
        setResponsiveSize(({ width }) => ({
          width,
          height: (resizing.startHeight ?? 0) - (y - (resizing.startY ?? 0)),
        }))
      } else if (resizing.handle === 'left') {
        document.body.classList.add('cursor_ew-resize')
        setResponsiveSize(({ height }) => ({
          width: (resizing.startWidth ?? 0) - (x - (resizing.startX ?? 0)) * 2,
          height,
        }))
      } else if (resizing.handle === 'right') {
        document.body.classList.add('cursor_ew-resize')
        setResponsiveSize(({ height }) => ({
          width: (resizing.startWidth ?? 0) + (x - (resizing.startX ?? 0)) * 2,
          height,
        }))
      } else if (resizing.handle === 'bottom-left') {
        document.body.classList.add('cursor_nesw-resize')
        setResponsiveSize(() => ({
          width: (resizing.startWidth ?? 0) - (x - (resizing.startX ?? 0)) * 2,
          height: (resizing.startHeight ?? 0) + (y - (resizing.startY ?? 0)),
        }))
      } else if ((resizing.handle ?? 0) === 'bottom-right') {
        document.body.classList.add('cursor_nwse-resize')
        setResponsiveSize(() => ({
          width: (resizing.startWidth ?? 0) + (x - (resizing.startX ?? 0)) * 2,
          height: (resizing.startHeight ?? 0) + (y - (resizing.startY ?? 0)),
        }))
      } else if ((resizing.handle ?? 0) === 'top-left') {
        document.body.classList.add('cursor_nwse-resize')
        setResponsiveSize(() => ({
          width: (resizing.startWidth ?? 0) - (x - (resizing.startX ?? 0)) * 2,
          height: (resizing.startHeight ?? 0) - (y - (resizing.startY ?? 0)),
        }))
      } else if ((resizing.handle ?? 0) === 'top-right') {
        document.body.classList.add('cursor_nesw-resize')
        setResponsiveSize(() => ({
          width: (resizing.startWidth ?? 0) + (x - (resizing.startX ?? 0)) * 2,
          height: (resizing.startHeight ?? 0) - (y - (resizing.startY ?? 0)),
        }))
      }
    }

    function onMouseUp(e: Event) {
      e.preventDefault()
      if (!resizing) return
      if (resizing.handle === 'bottom') {
        document.body.classList.remove('cursor_ns-resize')
      } else if (resizing.handle === 'top') {
        document.body.classList.remove('cursor_ns-resize')
      } else if (resizing.handle === 'left') {
        document.body.classList.remove('cursor_ew-resize')
      } else if (resizing.handle === 'right') {
        document.body.classList.remove('cursor_ew-resize')
      } else if (resizing.handle === 'bottom-left') {
        document.body.classList.remove('cursor_nesw-resize')
      } else if (resizing.handle === 'bottom-right') {
        document.body.classList.remove('cursor_nwse-resize')
      } else if (resizing.handle === 'top-left') {
        document.body.classList.remove('cursor_nwse-resize')
      } else if (resizing.handle === 'top-right') {
        document.body.classList.remove('cursor_nesw-resize')
      }
      setResizing(undefined)
    }

    if (resizing) {
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
      window.addEventListener('touchmove', onMouseMove)
      window.addEventListener('touchend', onMouseUp)
      return () => {
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
        window.removeEventListener('touchmove', onMouseMove)
        window.removeEventListener('touchend', onMouseUp)
      }
    }
  }, [resizing, size])

  const startLeft: EventHandler<any> = (e) => {
    const pos = getPointerPosition(e)
    if (pos === null) return
    e.preventDefault()
    setResizing({
      handle: 'left',
      startWidth: constrainedResponsiveSize.width,
      startX: pos.x,
    })
  }

  const startRight: EventHandler<any> = (e) => {
    const pos = getPointerPosition(e)
    if (pos === null) return
    e.preventDefault()
    setResizing({
      handle: 'right',
      startWidth: constrainedResponsiveSize.width,
      startX: pos.x,
    })
  }

  const startBottomLeft: EventHandler<any> = (e) => {
    const pos = getPointerPosition(e)
    if (pos === null) return
    e.preventDefault()
    setResizing({
      handle: 'bottom-left',
      startWidth: constrainedResponsiveSize.width,
      startHeight: constrainedResponsiveSize.height,
      startX: pos.x,
      startY: pos.y,
    })
  }

  const startBottom: EventHandler<any> = (e) => {
    const pos = getPointerPosition(e)
    if (pos === null) return
    e.preventDefault()
    setResizing({
      handle: 'bottom',
      startHeight: constrainedResponsiveSize.height,
      startY: pos.y,
    })
  }

  const startBottomRight: EventHandler<any> = (e) => {
    const pos = getPointerPosition(e)
    if (pos === null) return
    e.preventDefault()
    setResizing({
      handle: 'bottom-right',
      startWidth: constrainedResponsiveSize.width,
      startHeight: constrainedResponsiveSize.height,
      startX: pos.x,
      startY: pos.y,
    })
  }

  const startTopLeft: EventHandler<any> = (e) => {
    const pos = getPointerPosition(e)
    if (pos === null) return
    e.preventDefault()
    setResizing({
      handle: 'top-left',
      startWidth: constrainedResponsiveSize.width,
      startHeight: constrainedResponsiveSize.height,
      startX: pos.x,
      startY: pos.y,
    })
  }

  const startTop: EventHandler<any> = (e) => {
    const pos = getPointerPosition(e)
    if (pos === null) return
    e.preventDefault()
    setResizing({
      handle: 'top',
      startHeight: constrainedResponsiveSize.height,
      startY: pos.y,
    })
  }

  const startTopRight: EventHandler<any> = (e) => {
    const pos = getPointerPosition(e)
    if (pos === null) return
    e.preventDefault()
    setResizing({
      handle: 'top-right',
      startWidth: constrainedResponsiveSize.width,
      startHeight: constrainedResponsiveSize.height,
      startX: pos.x,
      startY: pos.y,
    })
  }

  return {
    setContainerRef,
    setResponsiveSize,
    activeBreakpoint,
    constrainedResponsiveSize,
    startLeft,
    startRight,
    startBottomLeft,
    startBottom,
    startBottomRight,
    startTopLeft,
    startTop,
    startTopRight,
    resizing,
    size,
    breakpoints,
  }
}

export type UseResponsiveView = ReturnType<typeof useResponsiveView>
