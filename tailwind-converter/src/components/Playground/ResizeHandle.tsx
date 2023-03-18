import { PanelResizeHandle } from 'react-resizable-panels'
import { css } from '../../../design-system/css'
import { panda } from '../../../design-system/jsx'

// adapted from https://github.com/bvaughn/react-resizable-panels/blob/820f48f263407b6b78feecf975a6914c417107e6/packages/react-resizable-panels-website/src/components/ResizeHandle.tsx
export function ResizeHandle({ className = '', id }: { className?: string; id?: string }) {
  return (
    <PanelResizeHandle
      className={[
        css({
          position: 'relative',
          outline: 'none',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'stretch',
        }),
        className,
      ].join(' ')}
      id={id ?? null}
      style={{ flex: '0 0 1.5em', transition: 'background-color .2s linear' }}
    >
      <panda.div
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderRadius="sm"
        flex={1}
        backgroundColor="gray.100"
      >
        <Icon
          className={css({
            boxSize: '4',
            _resizeHandleActive: { display: 'none' },
            _panelVerticalActive: { display: 'none' },
          })}
          type="resize-horizontal"
        />
        <Icon
          className={css({
            boxSize: '4',
            _resizeHandleActive: { display: 'none' },
            _panelHorizontalActive: { display: 'none' },
          })}
          type="resize-vertical"
        />
      </panda.div>
    </PanelResizeHandle>
  )
}

export type IconType =
  | 'chevron-down'
  | 'close'
  | 'css'
  | 'files'
  | 'horizontal-collapse'
  | 'horizontal-expand'
  | 'html'
  | 'markdown'
  | 'resize-horizontal'
  | 'resize-vertical'
  | 'search'
  | 'typescript'

function Icon({ className = '', type }: { className?: string; type: IconType }) {
  let path = ''
  switch (type) {
    case 'chevron-down': {
      path = 'M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z'
      break
    }

    case 'close': {
      path =
        'M20 6.91L17.09 4L12 9.09L6.91 4L4 6.91L9.09 12L4 17.09L6.91 20L12 14.91L17.09 20L20 17.09L14.91 12L20 6.91Z'
      break
    }

    case 'css': {
      path =
        'M5,3L4.35,6.34H17.94L17.5,8.5H3.92L3.26,11.83H16.85L16.09,15.64L10.61,17.45L5.86,15.64L6.19,14H2.85L2.06,18L9.91,21L18.96,18L20.16,11.97L20.4,10.76L21.94,3H5Z'
      break
    }

    case 'files': {
      path =
        'M15,7H20.5L15,1.5V7M8,0H16L22,6V18A2,2 0 0,1 20,20H8C6.89,20 6,19.1 6,18V2A2,2 0 0,1 8,0M4,4V22H20V24H4A2,2 0 0,1 2,22V4H4Z'
      break
    }

    case 'horizontal-collapse': {
      path = 'M13,20V4H15.03V20H13M10,20V4H12.03V20H10M5,8L9.03,12L5,16V13H2V11H5V8M20,16L16,12L20,8V11H23V13H20V16Z'
      break
    }

    case 'horizontal-expand': {
      path = 'M9,11H15V8L19,12L15,16V13H9V16L5,12L9,8V11M2,20V4H4V20H2M20,20V4H22V20H20Z'
      break
    }

    case 'html': {
      path =
        'M12,17.56L16.07,16.43L16.62,10.33H9.38L9.2,8.3H16.8L17,6.31H7L7.56,12.32H14.45L14.22,14.9L12,15.5L9.78,14.9L9.64,13.24H7.64L7.93,16.43L12,17.56M4.07,3H19.93L18.5,19.2L12,21L5.5,19.2L4.07,3Z'
      break
    }

    case 'markdown': {
      path =
        'M20.56 18H3.44C2.65 18 2 17.37 2 16.59V7.41C2 6.63 2.65 6 3.44 6H20.56C21.35 6 22 6.63 22 7.41V16.59C22 17.37 21.35 18 20.56 18M6.81 15.19V11.53L8.73 13.88L10.65 11.53V15.19H12.58V8.81H10.65L8.73 11.16L6.81 8.81H4.89V15.19H6.81M19.69 12H17.77V8.81H15.85V12H13.92L16.81 15.28L19.69 12Z'
      break
    }

    case 'resize-horizontal': {
      path = 'M18,16V13H15V22H13V2H15V11H18V8L22,12L18,16M2,12L6,16V13H9V22H11V2H9V11H6V8L2,12Z'
      break
    }

    case 'resize-vertical': {
      path = 'M8,18H11V15H2V13H22V15H13V18H16L12,22L8,18M12,2L8,6H11V9H2V11H22V9H13V6H16L12,2Z'
      break
    }

    case 'search': {
      path =
        'M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z'
      break
    }

    case 'typescript': {
      path =
        'M3,3H21V21H3V3M13.71,17.86C14.21,18.84 15.22,19.59 16.8,19.59C18.4,19.59 19.6,18.76 19.6,17.23C19.6,15.82 18.79,15.19 17.35,14.57L16.93,14.39C16.2,14.08 15.89,13.87 15.89,13.37C15.89,12.96 16.2,12.64 16.7,12.64C17.18,12.64 17.5,12.85 17.79,13.37L19.1,12.5C18.55,11.54 17.77,11.17 16.7,11.17C15.19,11.17 14.22,12.13 14.22,13.4C14.22,14.78 15.03,15.43 16.25,15.95L16.67,16.13C17.45,16.47 17.91,16.68 17.91,17.26C17.91,17.74 17.46,18.09 16.76,18.09C15.93,18.09 15.45,17.66 15.09,17.06L13.71,17.86M13,11.25H8V12.75H9.5V20H11.25V12.75H13V11.25Z'
      break
    }
  }

  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="currentColor" d={path} />
    </svg>
  )
}
