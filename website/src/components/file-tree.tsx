import { useState, useCallback, createContext, useContext, memo } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { css, cx } from '../../styled-system/css'

const ctx = createContext(0)

function useIndent() {
  return useContext(ctx)
}

interface FolderProps {
  name: string
  label?: ReactElement
  open?: boolean
  defaultOpen?: boolean
  onToggle?: (open: boolean) => void
  children: ReactNode
}

interface FileProps {
  name: string
  label?: ReactElement
  active?: boolean
}

const Tree = ({ children }: { children: ReactNode }): ReactElement => (
  <div
    className={css({
      marginTop: 6,
      userSelect: 'none',
      textStyle: 'sm',
      color: 'gray.800',
      _dark: {
        color: 'gray.300',
        _hover: {
          pt: 0,
          color: 'gray.50'
        }
      }
    })}
  >
    <div
      className={css({
        display: 'inline-flex',
        flexDirection: 'column',
        borderRadius: 'lg',
        border: '1px solid',
        px: 4,
        py: 2,
        _dark: { borderColor: 'rgb(38 38 38 / 1)' }
      })}
    >
      {children}
    </div>
  </div>
)

function Ident(): ReactElement {
  const indent = useIndent()

  return (
    <>
      {[...Array(indent)].map((_, i) => (
        <span
          className={css({ display: 'inline-block', width: '5px' })}
          key={i}
        />
      ))}
    </>
  )
}

const Folder = memo<FolderProps>(
  ({ label, name, open, children, defaultOpen = false, onToggle }) => {
    const indent = useIndent()
    const [isOpen, setIsOpen] = useState(defaultOpen)

    const toggle = useCallback(() => {
      onToggle?.(!isOpen)
      setIsOpen(!isOpen)
    }, [isOpen, onToggle])

    const isFolderOpen = open === undefined ? isOpen : open

    return (
      <li
        className={css({
          display: 'flex',
          listStyle: 'none',
          flexDirection: 'column'
        })}
      >
        <a
          onClick={toggle}
          title={name}
          className={css({
            display: 'inline-flex',
            cursor: 'pointer',
            alignItems: 'center',
            py: 1,
            _hover: { opacity: 0.6 }
          })}
        >
          <Ident />
          <svg width="1em" height="1em" viewBox="0 0 24 24">
            <path
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d={
                isFolderOpen
                  ? 'M5 19a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2 2h4a2 2 0 0 1 2 2v1M5 19h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2Z'
                  : 'M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2Z'
              }
            />
          </svg>
          <span className={css({ ml: 1 })}>{label ?? name}</span>
        </a>
        {isFolderOpen && (
          <ul>
            <ctx.Provider value={indent + 1}>{children}</ctx.Provider>
          </ul>
        )}
      </li>
    )
  }
)
Folder.displayName = 'Folder'

const File = memo<FileProps>(({ label, name, active }) => (
  <li
    className={cx(
      css({ display: 'flex', listStyle: 'none' }),
      active &&
        css({ color: 'primary.600', _moreContrast: { color: 'primary.400' } })
    )}
  >
    <a
      className={css({
        display: 'inline-flex',
        cursor: 'default',
        alignItems: 'center',
        py: 1
      })}
    >
      <Ident />
      <svg width="1em" height="1em" viewBox="0 0 24 24">
        <path
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z"
        />
      </svg>
      <span className={css({ ml: 1 })}>{label ?? name}</span>
    </a>
  </li>
))
File.displayName = 'File'

export const FileTree = Object.assign(Tree, { Folder, File })
