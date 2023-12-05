import React from 'react'
import { LiveProvider, useLiveContext } from 'react-live-runner'
import { useIsClient } from 'usehooks-ts'
import { createPortal } from 'react-dom'
import { usePreview } from '@/src/hooks/usePreview'
import { css } from '@/styled-system/css'
import { flex } from '@/styled-system/patterns'
import { UseResponsiveView } from '@/src/hooks/useResponsiveView'
import { responsiveBorder } from '@/src/components/Preview/responsive-border'
import { ErrorIcon } from '@/src/components/icons'
import { UsePanda } from '@/src/hooks/usePanda'

export type PreviewProps = {
  source: string
  isResponsive: boolean
  panda: UsePanda
  responsiveView: UseResponsiveView
}

export const Preview = (props: PreviewProps) => {
  const { source, isResponsive, responsiveView, panda } = props
  const { previewCss = '', previewJs } = panda

  const isClient = useIsClient()

  const { handleLoad, contentRef, setContentRef, iframeLoaded, isReady, srcDoc } = usePreview()

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
    activeBreakpoint,
  } = responsiveView

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
    const transformed = `${previewJs.replaceAll(/export /g, '')}\n${source
      .replaceAll(/(?<!!)import.*/g, '')
      .concat(`\nrender(<${defaultExportName} />)`)}`

    const contents = (
      <LiveProvider code={transformed} scope={React}>
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
            width: constrainedResponsiveSize.width * constrainedResponsiveSize.zoom,
            height: constrainedResponsiveSize.height * constrainedResponsiveSize.zoom,
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
              {`${constrainedResponsiveSize.width} × ${constrainedResponsiveSize.height}`}{' '}
              <span className={css({ color: 'gray.500' })}>
                ({Math.round(constrainedResponsiveSize.zoom * 100)}
                %)
              </span>{' '}
              - {activeBreakpoint}
            </div>
          </div>
          {Object.entries(resizers).map(([position, handler], key) => (
            <div
              key={key}
              className={responsiveBorder({ position: position as keyof typeof resizers })}
              onMouseDown={handler}
              onTouchStart={handler}
              data-resizing={resizing?.handle === camelToKebabCase(position) ? '' : undefined}
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

  function renderError() {
    return (
      <div className="playgroundError">
        <span>
          <ErrorIcon />
        </span>
        <pre>{error}</pre>
      </div>
    )
  }

  return error ? renderError() : <></>
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
function camelToKebabCase(inputString: string) {
  return inputString.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

function ResizeIcon() {
  return (
    <svg viewBox="0 0 6 16" width={6} height={16} fill="none" stroke="currentColor">
      <path d="M 0.5 0 V 16 M 5.5 0 V 16" />
    </svg>
  )
}
