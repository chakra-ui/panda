import { responsiveBorder } from '@/components/preview/responsive-border'
import { type UsePanda } from '@/hooks/use-panda'
import { useResponsiveView } from '@/components/preview/use-responsive-view'
import { SandpackPreview } from '@codesandbox/sandpack-react'
import { useRef } from 'react'
import { css } from 'styled-system/css'
import { flex } from 'styled-system/patterns'
import { useIsClient } from 'usehooks-ts'
import { usePreview } from './use-preview'

export type PreviewProps = {
  source: string
  isResponsive: boolean
  panda: UsePanda
}

export const PreviewWindow = (props: PreviewProps) => {
  const { isResponsive } = props
  const isClient = useIsClient()

  const {
    setContainerRef,
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
  } = useResponsiveView()

  // prevent false positive for server-side rendering
  if (!isClient) {
    return null
  }

  const resizers = {
    left: startLeft,
    right: startRight,
    bottom: startBottom,
    bottomRight: startBottomRight,
    bottomLeft: startBottomLeft,
    topLeft: startTopLeft,
    topRight: startTopRight,
  } as const

  return (
    <div
      ref={setContainerRef}
      data-responsive={isResponsive ? '' : undefined}
      data-resizing={resizing ? '' : undefined}
      className={css({
        h: 'full',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        w: 'full',
        pos: 'relative',
        bg: { base: 'gray.50', _dark: '#262626' },

        '&[data-responsive]': {
          p: '4',
          mt: '2',
        },
        '&[data-resizing]': {
          pointerEvents: 'none',
        },
      })}
    >
      {isResponsive && (
        <div
          className={flex({ align: 'flex-start', pos: 'absolute' })}
          style={{
            width:
              constrainedResponsiveSize.width * constrainedResponsiveSize.zoom,
            height:
              constrainedResponsiveSize.height * constrainedResponsiveSize.zoom,
          }}
        >
          <div
            className={responsiveBorder({ position: 'top' })}
            onMouseDown={startTop}
            onTouchStart={startTop}
            data-resizing={resizing?.handle === 'top' ? '' : undefined}
          >
            <div
              className={css({
                textStyle: 'xs',
                fontWeight: 'medium',
                color: { base: 'gray.600', _dark: 'gray.400' },
              })}
            >
              {`${constrainedResponsiveSize.width} × ${constrainedResponsiveSize.height}`}
              {'  '}
              <span className={css({ color: 'gray.500' })}>
                ({Math.round(constrainedResponsiveSize.zoom * 100)}
                %)
              </span>
            </div>
          </div>
          {Object.entries(resizers).map(([position, handler], key) => (
            <div
              key={key}
              className={responsiveBorder({
                position: position as keyof typeof resizers,
              })}
              onMouseDown={handler}
              onTouchStart={handler}
              data-resizing={
                resizing?.handle === camelToKebabCase(position) ? '' : undefined
              }
            >
              <ResizeIcon />
            </div>
          ))}
        </div>
      )}
      <div
        className={css({
          pos: 'relative',
          w: 'full',
          h: 'full',
        })}
        style={
          isResponsive
            ? {
                width: constrainedResponsiveSize.width,
                height: constrainedResponsiveSize.height,

                transformOrigin: 'top center',
                transform: `scale(${constrainedResponsiveSize.zoom})`,
              }
            : {}
        }
      >
        <div
          className={css({
            overflow: 'auto',
            w: 'full',
            h: 'full',
          })}
          style={
            isResponsive
              ? {
                  width: constrainedResponsiveSize.width,
                  height: constrainedResponsiveSize.height,
                }
              : {}
          }
        >
          <CodePreview />
        </div>
      </div>
    </div>
  )
}

const CodePreview = () => {
  const listenerRef = useRef<Function | null>(null)
  const preview = usePreview()

  return (
    <SandpackPreview
      ref={(node) => {
        if (!node) return

        const iframe = node.getClient()?.iframe
        if (!iframe) return

        preview.setContentRef(iframe)
        listenerRef.current?.()
        iframe.addEventListener('load', preview.handleLoad)
        listenerRef.current = () => {
          iframe.removeEventListener('load', preview.handleLoad)
        }
      }}
      className={css({ minHeight: '100%' })}
      showOpenInCodeSandbox
      showRefreshButton
      showSandpackErrorOverlay
    />
  )
}

function camelToKebabCase(inputString: string) {
  return inputString.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

function ResizeIcon() {
  return (
    <svg
      viewBox='0 0 6 16'
      width={6}
      height={16}
      fill='none'
      stroke='currentColor'
    >
      <path d='M 0.5 0 V 16 M 5.5 0 V 16' />
    </svg>
  )
}
