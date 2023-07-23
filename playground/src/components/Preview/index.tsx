import { LiveProvider, useLiveContext } from 'react-live-runner'
import { useIsClient } from 'usehooks-ts'
import { createPortal } from 'react-dom'
import { usePreview, PreviewProps } from '@/src/hooks/usePreview'
import { css } from '@/styled-system/css'
import { flex } from '@/styled-system/patterns'
import { useResponsiveView } from '@/src/hooks/useResponsiveView'
import { responsiveBorder } from '@/src/components/Preview/responsive-border'

export const Preview = (props: PreviewProps) => {
  const { previewCss = '', source, isResponsive } = props
  const isClient = useIsClient()

  const { handleLoad, contentRef, setContentRef, iframeLoaded, isReady, srcDoc } = usePreview(props)

  const {
    setContainerRef,
    setWrapperRef,
    wrapperSize,
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

  function renderContent() {
    if (!isReady) {
      return null
    }

    const defaultExportName = extractDefaultExportedFunctionName(source) ?? 'App'
    const transformed = source
      .replaceAll(/import.*/g, '')
      .replaceAll(/export default /g, '')
      .replaceAll(/export /g, '')
      .concat(`\nrender(<${defaultExportName} />)`)

    const contents = (
      <LiveProvider code={transformed} scope={(contentRef?.contentWindow as any)?.panda}>
        <LiveError />
        <LivePreview />
      </LiveProvider>
    )

    const doc = contentRef?.contentDocument

    return [
      doc?.head && createPortal(<style>{previewCss}</style>, doc.head),
      doc?.body && createPortal(contents, doc.body),
    ]
  }

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
            width: wrapperSize.width,
            height: wrapperSize.height,
          }}
        >
          <div className={responsiveBorder({ position: 'top' })} onMouseDown={startTop} onTouchStart={startTop}>
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
              className={responsiveBorder({ position: position as keyof typeof resizers })}
              onMouseDown={handler}
              onTouchStart={handler}
            >
              <ResizeIcon />
            </div>
          ))}
        </div>
      )}
      <div
        ref={setWrapperRef}
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
          <iframe
            srcDoc={srcDoc}
            ref={setContentRef}
            allow="none"
            width="100%"
            onLoad={handleLoad}
            className={css({
              w: 'full',
              h: 'full',
            })}
          >
            {iframeLoaded && renderContent()}
          </iframe>
        </div>
      </div>
    </div>
  )
}

function LiveError() {
  const { error } = useLiveContext()

  return error ? <pre className="playgroundError">{error}</pre> : <></>
}

function LivePreview() {
  const { element } = useLiveContext()

  return element
}

const defaultFunctionRegex = /export\s+default\s+function\s+(\w+)/
function extractDefaultExportedFunctionName(code: string) {
  const match = code.match(defaultFunctionRegex)
  if (match && match[1]) {
    return match[1]
  } else {
    return extractDefaultArrowFunctionName(code)
  }
}

const defaultArrowFnIdentifierRegex = /export\s+default\s+(\w+)/
function extractDefaultArrowFunctionName(code: string) {
  const match = code.match(defaultArrowFnIdentifierRegex)
  if (match && match[1]) {
    return match[1]
  } else {
    return null
  }
}

function ResizeIcon() {
  return (
    <svg viewBox="0 0 6 16" width={6} height={16} fill="none" stroke="currentColor">
      <path d="M 0.5 0 V 16 M 5.5 0 V 16" />
    </svg>
  )
}
